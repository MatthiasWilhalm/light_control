#include <Arduino.h>
void setLed(uint8_t ledIndex, uint8_t state);
void setAllLeds(String ledsToSet);
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

  // Commands

  // reset
  if(text.equals("reset")) {
    reset();
    return;
  }

  // set:00000000 (8 bits, 0 = off, 1 = on)
  // to set all LEDs at once
  if(text.startsWith("set")) {
    String ledsToSet = text.substring(3);
    setAllLeds(ledsToSet);
    return;
  }

  // default single LED control
  int ledIndex = text.substring(0, text.indexOf(',')).toInt();
  int ledState = text.substring(text.indexOf(',') + 1).toInt(); // 0 = off, 1 = on
  setLed(ledIndex, ledState);
}

/**
 * @brief Sets a single LED.
 * 
 * @param ledIndex 0-7
 * @param state 0 = off, 1 = on
 */
void setLed(uint8_t ledIndex, uint8_t state) {
  if(ledIndex > 7 || ledIndex < 0) {
    Serial.println("Invalid LED index ("+String(ledIndex)+")");
    return;
  }
  if(state == LOW) {
    Serial.println("Turning off LED "+String(ledIndex));
  } else if (state == HIGH) {
    Serial.println("Turning on LED "+String(ledIndex));
  } else {
    Serial.println("Invalid LED state ("+String(state)+")");
    return;
  }
  digitalWrite(ledPins[ledIndex], state);
}

/**
 * @brief Sets all LEDs at once.
 * format: ledIndex,ledState (e.g. 0,1 = turn on LED 0)
 * @param ledsToSet 8 bits as string, 0 = off, 1 = on
 */
void setAllLeds(String ledsToSet) {
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    if(ledsToSet[i] == '1') {
      digitalWrite(ledPins[i], HIGH);
    } else {
      digitalWrite(ledPins[i], LOW);
    }
  }
  
}

/**
 * @brief Turns off all LEDs.
 * 
 */
void reset() {
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    digitalWrite(ledPins[i], LOW);
  }
}
