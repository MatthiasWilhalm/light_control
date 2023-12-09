#include <Arduino.h>

#define DATA_PIN  8  // Pin connected to DS of 74HC595
#define LATCH_PIN 9  // Pin connected to STCP of 74HC595
#define CLOCK_PIN 10 // Pin connected to SHCP of 74HC595

#define NUM_SHIFT_REGS 3

void setAllLeds(String ledsToSet);
void clearRegisters();
void writeRegisters();
void setRegisterPin(int index, int value);

const uint8_t numOfRegisterPins = NUM_SHIFT_REGS * 8;

bool registers[numOfRegisterPins];

void setup() {
  Serial.begin(9600);
  Serial.println("Starting up...");
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  clearRegisters();
  writeRegisters();
}

void loop() {
  String text = Serial.readString();
  if(text.length() == 0) {
    return;
  }

  // Commands

  // reset
  if(text.equals("reset")) {
    clearRegisters();
    writeRegisters();
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
  setRegisterPin(ledIndex, ledState);
  writeRegisters();
}

/**
 * @brief Sets all LEDs at once.
 * format: ledIndex,ledState (e.g. 0,1 = turn on LED 0)
 * @param ledsToSet 8 bits as string, 0 = off, 1 = on
 */
void setAllLeds(String ledsToSet) {
  for (uint8_t i = 0; i < numOfRegisterPins; i++) {
    setRegisterPin(i, ledsToSet[i] == '1');
  }
  writeRegisters();
}

void clearRegisters() {
  // Reset all register pins
  for (int i = numOfRegisterPins - 1; i >= 0; i--) {
    registers[i] = LOW;
  }
}

void setRegisterPin(int index, int value) {
  // Set an individual pin HIGH or LOW
  registers[index] = value;
}

void writeRegisters() {
  // Set and display registers
  digitalWrite(LATCH_PIN, LOW);

  for (int i = numOfRegisterPins - 1; i >= 0; i--) {
    digitalWrite(CLOCK_PIN, LOW);
    digitalWrite(DATA_PIN, registers[i]);
    digitalWrite(CLOCK_PIN, HIGH);
  }

  digitalWrite(LATCH_PIN, HIGH);
}