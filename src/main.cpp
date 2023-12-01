#include <Arduino.h>
void reset();

const uint8_t ledPins[] = {3, 4, 5, 6, 7, 8, 9, 10};

void setup() {
  Serial.begin(9600);
  Serial.println("Starting up...");
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    pinMode(ledPins[i], OUTPUT);
  }
  reset();
}

void loop() {
  String text = Serial.readString();
  if(text.length() == 0) {
    return;
  }
  if(text.equals("reset")) {
    reset();
    return;
  }
  int ledIndex = text.substring(0, text.indexOf(',')).toInt();
  int ledState = text.substring(text.indexOf(',') + 1).toInt(); // 0 = off, 1 = on
  
  if(ledIndex > 7 || ledIndex < 0) {
    Serial.println("Invalid LED index ("+String(ledIndex)+")");
    return;
  }

  if(ledState == 0) {
    Serial.println("Turning off LED "+String(ledIndex));
    digitalWrite(ledPins[ledIndex], LOW);
    return;
  } 
  if(ledState == 1) {
    Serial.println("Turning on LED "+String(ledIndex));
    digitalWrite(ledPins[ledIndex], HIGH);
    return;
  }
  Serial.println("Invalid LED state ("+String(ledState)+")");
}

void reset() {
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    digitalWrite(ledPins[i], LOW);
  }
}
