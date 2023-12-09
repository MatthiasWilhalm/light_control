/*
   Arduino code for Individual control over each pin
   Support for 40+ 74HC595 8 bit shift registers
   http://bildr.org/2011/02/74hc595/
*/

#include <Arduino.h>

#define DATA_PIN  8  // Pin connected to DS of 74HC595
#define LATCH_PIN 9  // Pin connected to STCP of 74HC595
#define CLOCK_PIN 10 // Pin connected to SHCP of 74HC595

// How many of the shift registers
#define NUM_SHIFT_REGS 3

const uint8_t numOfRegisterPins = NUM_SHIFT_REGS * 8;

bool registers[numOfRegisterPins];

void setup() {
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  clearRegisters();
  writeRegisters();
}

bool toggle = false;

void loop() {
  for (uint8_t i = 0; i < 16; i++) {
    if (i % 2 == 0) {
      setRegisterPin(i, toggle);
    } else {
      setRegisterPin(i, !toggle);
    }
  }
  writeRegisters();
  delay(500);
  toggle = !toggle;
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
