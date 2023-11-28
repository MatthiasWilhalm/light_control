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
  int ledIndex = text.toInt();
  Serial.println("Received: " + String(ledIndex));
  if(ledIndex > 7 || ledIndex < 0) {
    return;
  }
  reset();
  digitalWrite(ledPins[ledIndex], HIGH);
}

void reset() {
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    digitalWrite(ledPins[i], LOW);
  }
}
