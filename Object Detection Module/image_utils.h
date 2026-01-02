/*
 * Image preprocessing utilities for ESP32-CAM ML inference
 * Converts JPEG to grayscale 96x96 for TensorFlow Lite
 */

#ifndef IMAGE_UTILS_H
#define IMAGE_UTILS_H

#include "esp_camera.h"
#include "img_converters.h"

// Bilinear interpolation for image resizing
uint8_t bilinear_interpolate(uint8_t* img, int width, int height, float x, float y) {
  int x1 = (int)x;
  int y1 = (int)y;
  int x2 = x1 + 1;
  int y2 = y1 + 1;
  
  // Boundary check
  if(x2 >= width) x2 = width - 1;
  if(y2 >= height) y2 = height - 1;
  
  float dx = x - x1;
  float dy = y - y1;
  
  uint8_t p1 = img[y1 * width + x1];
  uint8_t p2 = img[y1 * width + x2];
  uint8_t p3 = img[y2 * width + x1];
  uint8_t p4 = img[y2 * width + x2];
  
  float val = p1 * (1 - dx) * (1 - dy) +
              p2 * dx * (1 - dy) +
              p3 * (1 - dx) * dy +
              p4 * dx * dy;
  
  return (uint8_t)val;
}

// Convert camera frame to 96x96 grayscale for ML model
bool preprocessImageForML(camera_fb_t* fb, int8_t* output_buffer, int target_size = 96) {
  if(!fb || !output_buffer) return false;
  
  Serial.println("Converting JPEG to RGB...");
  
  // Allocate buffer for RGB888 conversion
  size_t rgb888_len = fb->width * fb->height * 3;
  uint8_t* rgb888_buf = (uint8_t*)malloc(rgb888_len);
  if(!rgb888_buf) {
    Serial.println("Failed to allocate RGB888 buffer");
    return false;
  }
  
  // Convert JPEG to RGB888
  bool jpeg_converted = fmt2rgb888(fb->buf, fb->len, fb->format, rgb888_buf);
  
  if(!jpeg_converted || !rgb888_buf) {
    Serial.println("JPEG conversion failed");
    return false;
  }
  
  int src_width = fb->width;
  int src_height = fb->height;
  
  Serial.printf("Original size: %dx%d\n", src_width, src_height);
  Serial.printf("Target size: %dx%d\n", target_size, target_size);
  
  // Allocate temporary grayscale buffer
  uint8_t* gray_buf = (uint8_t*)malloc(src_width * src_height);
  if(!gray_buf) {
    free(rgb888_buf);
    Serial.println("Failed to allocate grayscale buffer");
    return false;
  }
  
  // Convert RGB to grayscale
  Serial.println("Converting to grayscale...");
  for(int i = 0; i < src_width * src_height; i++) {
    uint8_t r = rgb888_buf[i * 3];
    uint8_t g = rgb888_buf[i * 3 + 1];
    uint8_t b = rgb888_buf[i * 3 + 2];
    gray_buf[i] = (uint8_t)(0.299f * r + 0.587f * g + 0.114f * b);
  }
  
  free(rgb888_buf);
  
  // Resize to target size with bilinear interpolation
  Serial.println("Resizing image...");
  float x_ratio = (float)src_width / target_size;
  float y_ratio = (float)src_height / target_size;
  
  for(int y = 0; y < target_size; y++) {
    for(int x = 0; x < target_size; x++) {
      float src_x = x * x_ratio;
      float src_y = y * y_ratio;
      
      uint8_t pixel = bilinear_interpolate(gray_buf, src_width, src_height, src_x, src_y);
      
      // Normalize to [-128, 127] for INT8 quantized model
      output_buffer[y * target_size + x] = (int8_t)(pixel - 128);
    }
  }
  
  free(gray_buf);
  
  Serial.println("Preprocessing complete!");
  return true;
}

#endif // IMAGE_UTILS_H
