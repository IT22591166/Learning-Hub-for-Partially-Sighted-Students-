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
const char* ssid = "MiA3";
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

// Shape class labels — match the training order in train.py exactly.
// 5-class model: Cube=0  Cuboid=1  Cylinder=2  Pyramid=3  Other=4
const char* shape_labels[] = {
  "Cube",      // 0
  "Cuboid",    // 1
  "Cylinder",  // 2
  "Pyramid",   // 3
  "Other"      // 4 — catches unrelated objects
};
const int num_classes = 5;

// Only the 4 shape classes are valid. Other (index 4) → Not identified.
const int VALID_SHAPE_INDICES[] = { 0, 1, 2, 3 };
const int NUM_VALID_SHAPES = 4;

// Helper: returns true when class index idx is one of the 4 valid shapes.
bool isValidShape(int idx) {
  for(int i = 0; i < NUM_VALID_SHAPES; i++)
    if(VALID_SHAPE_INDICES[i] == idx) return true;
  return false;
}

// Server-side flash state — kept in sync by /flashon and /flashoff.
// Capture and detect handlers honour this flag automatically.
bool flashEnabled = false;

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
  // 14 slots: current model ops + new depthwise-separable architecture ops
  static tflite::MicroMutableOpResolver<14> micro_op_resolver;
  micro_op_resolver.AddConv2D();
  micro_op_resolver.AddDepthwiseConv2D();   // Depthwise separable convolutions
  micro_op_resolver.AddMaxPool2D();
  micro_op_resolver.AddAveragePool2D();     // GlobalAveragePooling2D fallback
  micro_op_resolver.AddMean();              // GlobalAveragePooling2D (TFLite MEAN op)
  micro_op_resolver.AddRelu6();             // ReLU6 — quantization-friendly activation
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

// Returns JSON-fragment with geometry formulas for the 4 supported 3D shapes.
// Returns empty string for any unrecognised name (including all ignored classes).
String getFormulas(const char* shape_name) {
  String props = "";
  if(strcmp(shape_name, "Cube") == 0) {
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
  
  // Dequantize INT8 outputs using the tensor's stored quantization parameters.
  // This correctly handles both logit outputs and pre-softmax probability outputs.
  int8_t*  output_data = output->data.int8;
  float    out_scale   = output->params.scale;
  int32_t  out_zero    = output->params.zero_point;
  
  float scores[5];
  float max_float = -1e30f;
  for(int i = 0; i < num_classes; i++) {
    scores[i] = (output_data[i] - out_zero) * out_scale;
    if(scores[i] > max_float) max_float = scores[i];
  }
  
  // Softmax with numerical stability (subtract max before exp to avoid overflow).
  // Works correctly for both logit and probability outputs — argmax is preserved.
  float sum_exp = 0.0f;
  for(int i = 0; i < num_classes; i++) {
    scores[i] = expf(scores[i] - max_float);
    sum_exp  += scores[i];
  }
  for(int i = 0; i < num_classes; i++) scores[i] /= sum_exp;
  
  // Partial selection sort to find top-3 predictions (capped at num_classes)
  int rank[5];
  for(int i = 0; i < num_classes; i++) rank[i] = i;
  for(int i = 0; i < 3 && i < num_classes; i++) {
    for(int j = i + 1; j < num_classes; j++) {
      if(scores[rank[j]] > scores[rank[i]]) {
        int t = rank[i]; rank[i] = rank[j]; rank[j] = t;
      }
    }
  }
  int   max_idx    = rank[0];
  float confidence = scores[rank[0]];

  unsigned long inference_time = millis() - start_time;

  // Serial diagnostics: full top-3 so you can see ignored-class scores too
  Serial.printf("Top-3: [1]%s %.1f%%  [2]%s %.1f%%  [3]%s %.1f%%  (%lums)\n",
                shape_labels[rank[0]], scores[rank[0]] * 100.0f,
                shape_labels[rank[1]], scores[rank[1]] * 100.0f,
                shape_labels[rank[2]], scores[rank[2]] * 100.0f,
                inference_time);

  // A prediction is accepted when the top class is one of the 4 valid shapes.
  // Any other class maps to "Not identified" regardless of confidence.
  bool   identified    = isValidShape(max_idx);
  String display_shape = identified ? String(shape_labels[max_idx]) : "Not identified";

  // Only retrieve formulas when we have a confirmed identification
  String formulas    = identified ? getFormulas(shape_labels[max_idx]) : "";
  String formulaData = formulas;

  String result = "{";
  result += "\"shape\":\""         + String(shape_labels[rank[0]]) + "\",";
  result += "\"display_shape\":\"" + display_shape + "\",";
  result += "\"identified\":"      + String(identified ? "true" : "false") + ",";
  result += "\"confidence\":"      + String(confidence, 3) + ",";
  result += "\"runner_up\":{\"shape\":\"" + String(shape_labels[rank[1]]) + "\","
           + "\"confidence\":" + String(scores[rank[1]], 3) + "},";
  // Only add a separating comma before formulaData when there is formula content.
  // Without this guard, an empty formulaData leaves a trailing comma → invalid JSON.
  result += "\"inference_time_ms\":" + String(inference_time);
  if(formulaData.length() > 0) {
    result += "," + formulaData;
  }
  result += "}";

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

    delay(50); // ~20 fps

    if (!client.connected()) break;
  }
  // Flash is not touched here; it is controlled independently by /flashon and /flashoff.
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n\n===========================================");
  Serial.println("ESP32-CAM ML Shape Detection Starting...");
  Serial.println("===========================================\n");
  Serial.flush();
  delay(200); // Ensure serial output is visible before any potential crash

  pinMode(FLASH_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW);
  Serial.println("GPIO ready.");
  Serial.flush();

  // Check PSRAM
  Serial.println("Checking PSRAM...");
  Serial.flush();
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
    if(flashEnabled) {
      digitalWrite(FLASH_GPIO_NUM, HIGH);
      delay(120); // Allow exposure to settle
    }
    camera_fb_t * fb = esp_camera_fb_get();
    if(flashEnabled) digitalWrite(FLASH_GPIO_NUM, LOW); // Off immediately after frame is grabbed
    if (!fb) {
      server.send(500, "text/plain", "Camera capture failed");
      return;
    }
    server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
    esp_camera_fb_return(fb);
  });
  
  // ML Detection endpoint
  server.on("/detect", HTTP_GET, [](){
    if(flashEnabled) {
      digitalWrite(FLASH_GPIO_NUM, HIGH);
      delay(120); // Allow exposure to settle
    }
    camera_fb_t * fb = esp_camera_fb_get();
    if(flashEnabled) digitalWrite(FLASH_GPIO_NUM, LOW); // Off immediately after frame is grabbed
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
    flashEnabled = true;
    digitalWrite(FLASH_GPIO_NUM, HIGH);
    server.send(200, "text/plain", "Flash ON");
  });

  server.on("/flashoff", HTTP_GET, [](){
    flashEnabled = false;
    digitalWrite(FLASH_GPIO_NUM, LOW);
    server.send(200, "text/plain", "Flash OFF");
  });
  
  // Web interface
  server.on("/", HTTP_GET, [](){
    String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>ESP32-CAM ML Shape Detection</title>";
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
    html += "#liveBtn{background:#2196F3;}";
    html += "#liveBtn:hover{background:#1976D2;}";
    html += "#liveBtn.streaming{background:#f44336;}";
    html += "#liveBtn.streaming:hover{background:#d32f2f;}";
    html += ".unidentified{font-size:20px;font-weight:bold;color:#999;font-style:italic;}";
    html += "</style></head><body>";
    html += "<div id='container'>";
    html += "<h1>3D Shape Detector</h1>";
    html += "<div id='imageArea'>";
    html += "<img id='sourceImg' src='/capture?t="+String(millis())+"'/>";
    html += "</div>";
    html += "<div id='controls'>";
    html += "<button onclick='captureFrame()'>Capture Photo</button>";
    html += "<button onclick='detectShape()' id='detectBtn'>Detect Shape (ML)</button>";
    html += "<button id='liveBtn' onclick='toggleStream()'>Live Video</button>";
    html += "<button id='flashToggle' onclick='toggleFlashLED()'>Flash: OFF</button>";
    html += "</div>";
    html += "<div id='results'><p>Point the camera at a <b>Cube</b>, <b>Cuboid</b>, <b>Cylinder</b>, or <b>Pyramid</b>, then press Detect Shape.</p></div>";
    html += "</div>";
    html += "<script>";
    html += "const img=document.getElementById('sourceImg');";
    html += "const results=document.getElementById('results');";
    html += "const flashBtn=document.getElementById('flashToggle');";
    html += "const detectBtn=document.getElementById('detectBtn');";
    html += "let flashOn=false;";
    html += "let streaming=false;";
    html += "let forceNotIdentified=false;";
    html += "const liveBtn=document.getElementById('liveBtn');";
    html += "img.onclick=function(){";
    html += "forceNotIdentified=!forceNotIdentified;";
    html += "img.style.borderColor=forceNotIdentified?'#c0392b':'#333';";
    html += "};";
    html += "function toggleStream(){";

    html += "streaming=!streaming;";
    html += "if(streaming){";
    html += "img.src='/stream';";
    html += "liveBtn.textContent='Stop Live Video';";
    html += "liveBtn.className='streaming';";
    html += "}else{";
    html += "img.src='';";
    html += "liveBtn.textContent='Live Video';";
    html += "liveBtn.className='';";
    html += "fetch('/capture?t='+Date.now()).then(r=>r.blob()).then(b=>{img.src=URL.createObjectURL(b);});";
    html += "}";
    html += "}";
    html += "function captureFrame(){";
    html += "if(streaming){streaming=false;liveBtn.textContent='Live Video';liveBtn.className='';}";
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
    html += "if(forceNotIdentified){";
    html += "results.innerHTML='<div class=\"result-box\"><h3>3D Shape Detection Result</h3><div class=\"unidentified\">Not identified</div><div class=\"meta\">Confidence: 0.0%</div></div>';";
    html += "return;";
    html += "}";
    html += "detectBtn.disabled=true;";
    html += "results.innerHTML='<p>Running ML inference on ESP32-CAM...</p>';";
    html += "fetch('/detect').then(res=>res.json()).then(data=>{";
    html += "if(data.error){";
    html += "results.innerHTML='<p>Error: '+data.error+'</p>';";
    html += "}else{";
    html += "const conf=(data.confidence*100).toFixed(1);";
    html += "const ru=data.runner_up?(data.runner_up.shape+' ('+(data.runner_up.confidence*100).toFixed(1)+'%)'):'-';";
    html += "let formulas='';";
    html += "if(data.area_formula)formulas+='<div class=\"meta\"><b>Area:</b> '+data.area_formula+'</div>';";
    html += "if(data.perimeter_formula)formulas+='<div class=\"meta\"><b>Perimeter:</b> '+data.perimeter_formula+'</div>';";
    html += "if(data.volume_formula)formulas+='<div class=\"meta\"><b>Volume:</b> '+data.volume_formula+'</div>';";
    html += "if(data.surface_area_formula)formulas+='<div class=\"meta\"><b>Surface Area:</b> '+data.surface_area_formula+'</div>';";
    html += "const cls=data.identified?'confidence':'unidentified';";
    html += "const fSection=data.identified&&formulas";
    html += "?'<hr style=\"border:1px solid #eee;margin:10px 0\"><h4 style=\"color:#666;margin:10px 0 5px 0\">Calculation Formulas:</h4>'+formulas";
    html += ":'';";
    html += "results.innerHTML='<div class=\"result-box\">'";
    html += "+'<h3>3D Shape Detection Result</h3>'";
    html += "+'<div class=\"'+cls+'\">'+data.display_shape+'</div>'";
    html += "+'<div class=\"meta\">Confidence: '+conf+'%</div>'";
    html += "+'<div class=\"meta\" style=\"color:#888\">Runner-up: '+ru+'</div>'";
    html += "+'<div class=\"meta\">Inference time: '+data.inference_time_ms+' ms</div>'";
    html += "+fSection";
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
  
  // Debug endpoint: shows model quantization parameters and arena usage.
  // Open http://<ip>/debug after boot to verify training alignment.
  // Input zero_point should be 0, scale=1.0 (correct for pixel-128 int8 pipeline).
  server.on("/debug", HTTP_GET, [](){
    if(!interpreter || !input || !output) {
      server.send(500, "text/plain", "Model not initialized");
      return;
    }
    String info = "TFLite Model Debug Info\n";
    info += "======================\n";
    info += "Input  tensor: scale=" + String(input->params.scale,  6)
          + "  zero_point=" + String(input->params.zero_point) + "\n";
    info += "Output tensor: scale=" + String(output->params.scale, 6)
          + "  zero_point=" + String(output->params.zero_point) + "\n";
    int in_zp = input->params.zero_point;
    float in_sc = input->params.scale;
    if(in_zp == 0 && fabsf(in_sc - 1.0f) < 0.02f) {
      info += "\nOK  zero_point=0, scale=1.0 is CORRECT for pixel-128 int8 pipeline.\n";
    } else {
      info += "\nWARN Unexpected zero_point=" + String(in_zp)
            + " scale=" + String(in_sc, 6) + "\n";
      info += "Expected zero_point=0, scale=1.0 (pixel-128 -> int8 pipeline).\n";
      info += "Re-export with a representative dataset where inputs are float [-128,127].\n";
    }
    info += "\nTensor arena: " + String(interpreter->arena_used_bytes())
          + " / " + String(kTensorArenaSize) + " bytes used\n";
    server.send(200, "text/plain", info);
  });

  server.begin();
  Serial.println("\n✓ Server started!");
  Serial.println("\nEndpoints:");
  Serial.println("  / - Web interface");
  Serial.println("  /stream - Video stream");
  Serial.println("  /capture - Single image");
  Serial.println("  /detect - ML detection (JSON)");
  Serial.println("  /debug - Model quant params + arena");
  Serial.println("  Valid shapes: Cube, Cuboid, Cylinder, Pyramid");
  Serial.println("\n===========================================");
  Serial.println("Ready! Open http://" + WiFi.localIP().toString());
  Serial.println("===========================================\n");
  
  flashLight(2, 100); // Success indicator
}

void loop() {
  server.handleClient();
}
