/*
 * ESP32-CAM Shape Detection with TensorFlow Lite
 * Uses trained ML model for accurate shape classification
 * 
 * Setup:
 * 1. Install TensorFlowLite_ESP32 library (Tools -> Manage Libraries)
 * 2. Copy shape_model.h to this sketch folder
 * 3. Set Board: AI Thinker ESP32-CAM
 * 4. Enable PSRAM: Tools -> PSRAM -> Enabled
 * 5. Upload!
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>

// TensorFlow Lite for Microcontrollers
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/schema/schema_generated.h"

// Include the trained model
#include "shape_model.h"

// Image preprocessing utilities
#include "image_utils.h"

#define CAMERA_MODEL_AI_THINKER

// AI Thinker Pin Definition
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define FLASH_GPIO_NUM     4

// WiFi credentials
const char* ssid = "ASHEN 9562";
const char* password = "123456789";

WebServer server(80);
const char* stream_boundary = "frame";

// TensorFlow Lite variables
namespace {
  const tflite::Model* model = nullptr;
  tflite::MicroInterpreter* interpreter = nullptr;
  TfLiteTensor* input = nullptr;
  TfLiteTensor* output = nullptr;
  
  // Tensor arena for model execution (adjust size if needed)
  constexpr int kTensorArenaSize = 300 * 1024; // 300KB
  uint8_t* tensor_arena = nullptr;
}

// Shape class labels (must match training order)
const char* shape_labels[] = {
  "Circle", "Square", "Rectangle", "Triangle",
  "Sphere", "Cube", "Cuboid", "Cylinder", "Cone", "Pyramid"
};
const int num_classes = 10;

// Model input size
const int model_width = 96;
const int model_height = 96;

// Function to blink flash LED
void flashLight(int times, int duration) {
  for(int i = 0; i < times; i++){
    digitalWrite(FLASH_GPIO_NUM, HIGH);
    delay(duration);
    digitalWrite(FLASH_GPIO_NUM, LOW);
    delay(duration);
  }
}

// Initialize TensorFlow Lite model
bool setupTensorFlow() {
  Serial.println("Initializing TensorFlow Lite...");
  
  // Allocate tensor arena in PSRAM if available
  if(psramFound()) {
    tensor_arena = (uint8_t*)ps_malloc(kTensorArenaSize);
    if(tensor_arena == nullptr) {
      Serial.println("Failed to allocate tensor arena in PSRAM");
      return false;
    }
    Serial.println("Tensor arena allocated in PSRAM");
  } else {
    Serial.println("ERROR: PSRAM required for TensorFlow Lite!");
    return false;
  }
  
  // Load the model
  model = tflite::GetModel(shape_model);
  if(model->version() != TFLITE_SCHEMA_VERSION) {
    Serial.printf("Model schema version %d doesn't match supported version %d\n",
                  model->version(), TFLITE_SCHEMA_VERSION);
    return false;
  }
  Serial.println("Model loaded successfully");
  
  // Setup operations resolver (add only operations used by the model)
  static tflite::MicroMutableOpResolver<10> micro_op_resolver;
  micro_op_resolver.AddConv2D();
  micro_op_resolver.AddMaxPool2D();
  micro_op_resolver.AddReshape();
  micro_op_resolver.AddFullyConnected();
  micro_op_resolver.AddSoftmax();
  micro_op_resolver.AddQuantize();
  micro_op_resolver.AddDequantize();
  micro_op_resolver.AddShape();
  micro_op_resolver.AddStridedSlice();
  micro_op_resolver.AddPack();
  
  // Build interpreter
  static tflite::MicroInterpreter static_interpreter(
    model, micro_op_resolver, tensor_arena, kTensorArenaSize);
  interpreter = &static_interpreter;
  
  // Allocate tensors
  TfLiteStatus allocate_status = interpreter->AllocateTensors();
  if(allocate_status != kTfLiteOk) {
    Serial.println("AllocateTensors() failed");
    return false;
  }
  
  // Get input and output tensors
  input = interpreter->input(0);
  output = interpreter->output(0);
  
  Serial.printf("Input shape: [%d, %d, %d, %d]\n",
                input->dims->data[0], input->dims->data[1],
                input->dims->data[2], input->dims->data[3]);
  Serial.printf("Output shape: [%d, %d]\n",
                output->dims->data[0], output->dims->data[1]);
  Serial.println("TensorFlow Lite initialized successfully!");
  
  return true;
}

// Preprocess image using utility function
bool preprocessImage(camera_fb_t* fb, int8_t* input_buffer) {
  return preprocessImageForML(fb, input_buffer, model_width);
}

// Get calculation formulas for each shape
String getFormulas(const char* shape_name) {
  String props = "";
  
  // 2D shapes
  if(strcmp(shape_name, "Circle") == 0) {
    props += "\"area_formula\":\"A = πr²\",";
    props += "\"perimeter_formula\":\"P = 2πr\"";
  }
  else if(strcmp(shape_name, "Square") == 0) {
    props += "\"area_formula\":\"A = a²\",";
    props += "\"perimeter_formula\":\"P = 4a\"";
  }
  else if(strcmp(shape_name, "Rectangle") == 0) {
    props += "\"area_formula\":\"A = l × w\",";
    props += "\"perimeter_formula\":\"P = 2(l + w)\"";
  }
  else if(strcmp(shape_name, "Triangle") == 0) {
    props += "\"area_formula\":\"A = ½bh\",";
    props += "\"perimeter_formula\":\"P = a + b + c\"";
  }
  // 3D shapes
  else if(strcmp(shape_name, "Sphere") == 0) {
    props += "\"volume_formula\":\"V = 4/3πr³\",";
    props += "\"surface_area_formula\":\"SA = 4πr²\"";
  }
  else if(strcmp(shape_name, "Cube") == 0) {
    props += "\"volume_formula\":\"V = a³\",";
    props += "\"surface_area_formula\":\"SA = 6a²\"";
  }
  else if(strcmp(shape_name, "Cuboid") == 0) {
    props += "\"volume_formula\":\"V = l × w × h\",";
    props += "\"surface_area_formula\":\"SA = 2(lw + lh + wh)\"";
  }
  else if(strcmp(shape_name, "Cylinder") == 0) {
    props += "\"volume_formula\":\"V = πr²h\",";
    props += "\"surface_area_formula\":\"SA = 2πr(r + h)\"";
  }
  else if(strcmp(shape_name, "Cone") == 0) {
    props += "\"volume_formula\":\"V = 1/3πr²h\",";
    props += "\"surface_area_formula\":\"SA = πr(r + l)\"";
  }
  else if(strcmp(shape_name, "Pyramid") == 0) {
    props += "\"volume_formula\":\"V = 1/3Bh\",";
    props += "\"surface_area_formula\":\"SA = B + ½Pl\"";
  }
  
  return props;
}

// Run ML inference on captured image
String detectShapeML(camera_fb_t* fb) {
  unsigned long start_time = millis();
  
  // Preprocess image
  int8_t* input_data = input->data.int8;
  if(!preprocessImage(fb, input_data)) {
    return "{\"error\":\"Preprocessing failed\"}";
  }
  
  // Run inference
  TfLiteStatus invoke_status = interpreter->Invoke();
  if(invoke_status != kTfLiteOk) {
    return "{\"error\":\"Inference failed\"}";
  }
  
  // Get results
  int8_t* output_data = output->data.int8;
  int max_idx = 0;
  int8_t max_score = output_data[0];
  
  for(int i = 1; i < num_classes; i++) {
    if(output_data[i] > max_score) {
      max_score = output_data[i];
      max_idx = i;
    }
  }
  
  // Convert quantized score to probability (approximate)
  float confidence = (max_score + 128) / 255.0f;
  
  // Get formulas for detected shape
  String formulas = getFormulas(shape_labels[max_idx]);
  
  unsigned long inference_time = millis() - start_time;
  
  String result = "{";
  result += "\"shape\":\"" + String(shape_labels[max_idx]) + "\",";
  result += "\"confidence\":" + String(confidence, 2) + ",";
  result += "\"inference_time_ms\":" + String(inference_time) + ",";
  result += formulas;
  result += "}";
  
  Serial.printf("Detected: %s (confidence: %.2f, time: %lums)\n",
                shape_labels[max_idx], confidence, inference_time);
  
  return result;
}

void handle_jpg_stream() {
  WiFiClient client = server.client();
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=" + String(stream_boundary) + "\r\n\r\n";
  client.print(response);

  while (true) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      break;
    }

    client.printf("--%s\r\n", stream_boundary);
    client.printf("Content-Type: image/jpeg\r\n");
    client.printf("Content-Length: %u\r\n\r\n", fb->len);
    client.write(fb->buf, fb->len);
    client.print("\r\n");

    esp_camera_fb_return(fb);
    
    digitalWrite(FLASH_GPIO_NUM, HIGH);
    delay(10);
    
    delay(50);

    if (!client.connected()) break;
  }
  
  digitalWrite(FLASH_GPIO_NUM, LOW);
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n\n===========================================");
  Serial.println("ESP32-CAM ML Shape Detection Starting...");
  Serial.println("===========================================\n");

  pinMode(FLASH_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW);

  // Check PSRAM
  if(psramFound()){
    Serial.println("✓ PSRAM found and enabled!");
    Serial.printf("  PSRAM size: %d bytes (%.2f MB)\n", 
                  ESP.getPsramSize(), ESP.getPsramSize() / (1024.0 * 1024.0));
  } else {
    Serial.println("✗ ERROR: PSRAM not found!");
    Serial.println("  Go to: Tools -> PSRAM -> Enabled");
    Serial.println("  Then re-upload the sketch.");
    return;
  }

  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA; // 320x240 for faster processing
  config.jpeg_quality = 10;
  config.fb_count = 2;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.grab_mode = CAMERA_GRAB_LATEST;

  Serial.println("Initializing camera...");
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("✗ Camera init failed with error 0x%x\n", err);
    return;
  }
  Serial.println("✓ Camera initialized successfully!");

  // Initialize TensorFlow Lite
  if(!setupTensorFlow()) {
    Serial.println("✗ TensorFlow initialization failed!");
    return;
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ WiFi connected!");
  Serial.print("  IP address: ");
  Serial.println(WiFi.localIP());

  // Setup web server
  server.on("/stream", HTTP_GET, handle_jpg_stream);
  
  server.on("/capture", HTTP_GET, [](){
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      server.send(500, "text/plain", "Camera capture failed");
      return;
    }
    digitalWrite(FLASH_GPIO_NUM, LOW);
    server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
    esp_camera_fb_return(fb);
  });
  
  // ML Detection endpoint
  server.on("/detect", HTTP_GET, [](){
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      server.send(500, "application/json", "{\"error\":\"Camera capture failed\"}");
      return;
    }
    
    String result = detectShapeML(fb);
    esp_camera_fb_return(fb);
    
    server.send(200, "application/json", result);
  });
  
  server.on("/flash", HTTP_GET, [](){
    flashLight(3, 200);
    server.send(200, "text/plain", "Flash triggered");
  });
  
  server.on("/flashon", HTTP_GET, [](){
    digitalWrite(FLASH_GPIO_NUM, HIGH);
    server.send(200, "text/plain", "Flash ON");
  });
  
  server.on("/flashoff", HTTP_GET, [](){
    digitalWrite(FLASH_GPIO_NUM, LOW);
    server.send(200, "text/plain", "Flash OFF");
  });
  
  // Web interface
  server.on("/", HTTP_GET, [](){
    String html = "<!DOCTYPE html><html><head><title>ESP32-CAM ML Shape Detection</title>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<style>";
    html += "body{font-family:Arial;margin:0;padding:20px;background:#f0f0f0;text-align:center;}";
    html += "#container{max-width:900px;margin:0 auto;background:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}";
    html += "h1{color:#333;margin-top:0;}";
    html += ".badge{background:#4CAF50;color:white;padding:5px 10px;border-radius:5px;font-size:12px;margin-left:10px;}";
    html += "#imageArea{position:relative;margin:20px 0;}";
    html += "#sourceImg{max-width:100%;border:2px solid #333;display:block;margin:10px auto;}";
    html += "button{background:#4CAF50;color:white;border:none;padding:12px 24px;margin:5px;font-size:16px;cursor:pointer;border-radius:5px;}";
    html += "button:hover{background:#45a049;}";
    html += "button:disabled{background:#ccc;cursor:not-allowed;}";
    html += "#flashToggle{background:#ff9800;}";
    html += "#flashToggle:hover{background:#f57c00;}";
    html += "#flashToggle.on{background:#f44336;}";
    html += "#controls{margin:20px 0;}";
    html += "#results{margin-top:20px;padding:15px;background:#f9f9f9;border-radius:5px;min-height:100px;text-align:left;}";
    html += ".result-box{padding:15px;background:white;border-left:4px solid #4CAF50;border-radius:3px;margin:10px 0;}";
    html += ".result-box h3{margin:0 0 10px 0;color:#4CAF50;}";
    html += ".confidence{font-size:24px;font-weight:bold;color:#333;}";
    html += ".meta{color:#666;font-size:14px;margin-top:10px;}";
    html += "</style></head><body>";
    html += "<div id='container'>";
    html += "<h1>ESP32-CAM ML Shape Detection<span class='badge'>TensorFlow Lite</span></h1>";
    html += "<div id='imageArea'>";
    html += "<img id='sourceImg' src='/capture?t="+String(millis())+"'/>";
    html += "</div>";
    html += "<div id='controls'>";
    html += "<button onclick='captureFrame()'>Capture Photo</button>";
    html += "<button onclick='detectShape()' id='detectBtn'>Detect Shape (ML)</button>";
    html += "<button id='flashToggle' onclick='toggleFlashLED()'>Flash: OFF</button>";
    html += "</div>";
    html += "<div id='results'><p>Click 'Capture Photo' to take a picture, then 'Detect Shape' to run ML inference...</p></div>";
    html += "</div>";
    html += "<script>";
    html += "const img=document.getElementById('sourceImg');";
    html += "const results=document.getElementById('results');";
    html += "const flashBtn=document.getElementById('flashToggle');";
    html += "const detectBtn=document.getElementById('detectBtn');";
    html += "let flashOn=false;";
    html += "function captureFrame(){";
    html += "results.innerHTML='<p>Capturing photo...</p>';";
    html += "fetch('/capture?t='+Date.now()).then(res=>res.blob()).then(blob=>{";
    html += "img.src=URL.createObjectURL(blob);";
    html += "results.innerHTML='<p>Photo captured! Click \\'Detect Shape\\' to run ML inference...</p>';";
    html += "if(flashOn){flashOn=false;flashBtn.textContent='Flash: OFF';flashBtn.className='';}";
    html += "});";
    html += "}";
    html += "function toggleFlashLED(){";
    html += "flashOn=!flashOn;";
    html += "fetch(flashOn?'/flashon':'/flashoff');";
    html += "flashBtn.textContent='Flash: '+(flashOn?'ON':'OFF');";
    html += "flashBtn.className=flashOn?'on':'';";
    html += "}";
    html += "function detectShape(){";
    html += "detectBtn.disabled=true;";
    html += "results.innerHTML='<p>🤖 Running ML inference on ESP32-CAM...</p>';";
    html += "fetch('/detect').then(res=>res.json()).then(data=>{";
    html += "if(data.error){";
    html += "results.innerHTML='<p>Error: '+data.error+'</p>';";
    html += "}else{";
    html += "const conf=(data.confidence*100).toFixed(1);";
    html += "let formulas='';";
    html += "if(data.area_formula)formulas+='<div class=\"meta\"><b>Area:</b> '+data.area_formula+'</div>';";
    html += "if(data.perimeter_formula)formulas+='<div class=\"meta\"><b>Perimeter:</b> '+data.perimeter_formula+'</div>';";
    html += "if(data.volume_formula)formulas+='<div class=\"meta\"><b>Volume:</b> '+data.volume_formula+'</div>';";
    html += "if(data.surface_area_formula)formulas+='<div class=\"meta\"><b>Surface Area:</b> '+data.surface_area_formula+'</div>';";
    html += "results.innerHTML='<div class=\"result-box\">'";
    html += "+'<h3>Detected Shape</h3>'";
    html += "+'<div class=\"confidence\">'+data.shape+'</div>'";
    html += "+'<div class=\"meta\">Confidence: '+conf+'%</div>'";
    html += "+'<div class=\"meta\">Inference time: '+data.inference_time_ms+' ms</div>'";
    html += "+'<hr style=\"border:1px solid #eee;margin:10px 0\">'";
    html += "+'<h4 style=\"color:#666;margin:10px 0 5px 0\">Calculation Formulas:</h4>'";
    html += "+formulas";
    html += "+'</div>';";
    html += "}";
    html += "detectBtn.disabled=false;";
    html += "}).catch(err=>{";
    html += "results.innerHTML='<p>Error: '+err+'</p>';";
    html += "detectBtn.disabled=false;";
    html += "});";
    html += "}";
    html += "</script>";
    html += "</body></html>";
    server.send(200, "text/html", html);
  });
  
  server.begin();
  Serial.println("\n✓ Server started!");
  Serial.println("\nEndpoints:");
  Serial.println("  / - Web interface");
  Serial.println("  /stream - Video stream");
  Serial.println("  /capture - Single image");
  Serial.println("  /detect - ML detection (JSON)");
  Serial.println("\n===========================================");
  Serial.println("Ready! Open http://" + WiFi.localIP().toString());
  Serial.println("===========================================\n");
  
  flashLight(2, 100); // Success indicator
}

void loop() {
  server.handleClient();
}
