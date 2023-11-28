#include <Arduino.h>
// #include <Math.h>
// #include <node.h>

// LightNetwork prepareNetwork();
void reset();

const uint8_t ledPins[] = {3, 4, 5, 6, 7, 8, 9, 10};
// static int counter = 0;
// static LightNetwork network = prepareNetwork();

void setup() {
  Serial.begin(9600);
  Serial.println("Starting up...");
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    pinMode(ledPins[i], OUTPUT);
  }
  reset();
}

void loop() {
  // Serial.println("Looping...("+String(counter)+")");
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
  
  // digitalWrite(ledPins[counter], HIGH);
  // delay(1000);
  // digitalWrite(ledPins[counter], LOW);
  // counter++;
  // if (counter > 7) {
  //   counter = 0;
  // }
}

void reset() {
  for (uint8_t i = 0; i < sizeof(ledPins); i++) {
    digitalWrite(ledPins[i], LOW);
  }
}

// function that returns a valid path from node 0 to node 4
// int* getRandomValidPath() {
//   int* path = new int[3];
//   const int historySize = 20;
//   int* nodeHistory = new int[historySize];
//   int latestNode = nodeHistory[historySize - 1];
//   int nextPathIndex = getRandomPathFromNode(&network.nodes[0]);
//   if(network.paths[nextPathIndex].nodes[0] == latestNode) {
//     nodeHistory[sizeof(nodeHistory)] = network.paths[nextPathIndex].nodes[1];
//   } else {
//     nodeHistory[sizeof(nodeHistory)] = network.paths[nextPathIndex].nodes[0];
//   }
// }

// int getRandomPathFromNode(Node* node) {
//   int pathIndex = random(0, 3);
//   return node->paths[pathIndex];
// }

// LightNetwork prepareNetwork() {
//   LightNetwork network;
//   network.nodes[0].index = 0;
//   network.nodes[0].paths[0] = 0;
//   network.nodes[0].paths[1] = 1;
//   network.nodes[0].paths[2] = 2;

//   network.nodes[1].index = 1;
//   network.nodes[1].paths[0] = 0;
//   network.nodes[1].paths[1] = 3;
//   network.nodes[1].paths[2] = 4;

//   network.nodes[2].index = 2;
//   network.nodes[2].paths[0] = 1;
//   network.nodes[2].paths[1] = 5;
//   network.nodes[2].paths[2] = 6;

//   network.nodes[3].index = 3;
//   network.nodes[3].paths[0] = 2;
//   network.nodes[3].paths[1] = 7;
//   network.nodes[3].paths[2] = 8;

//   network.nodes[4].index = 4;
//   network.nodes[4].paths[0] = 3;
//   network.nodes[4].paths[1] = 9;
//   network.nodes[4].paths[2] = 10;

//   // paths
//   network.paths[0].index = 0;
//   network.paths[0].pin = 3;
//   network.paths[0].nodes[0] = 0;
//   network.paths[0].nodes[1] = 1;

//   network.paths[1].index = 1;
//   network.paths[1].pin = 4;
//   network.paths[1].nodes[0] = 0;
//   network.paths[1].nodes[1] = 2;

//   network.paths[2].index = 2;
//   network.paths[2].pin = 5;
//   network.paths[2].nodes[0] = 0;
//   network.paths[2].nodes[1] = 3;

//   network.paths[3].index = 3;
//   network.paths[3].pin = 6;
//   network.paths[3].nodes[0] = 1;
//   network.paths[3].nodes[1] = 2;

//   network.paths[4].index = 4;
//   network.paths[4].pin = 7;
//   network.paths[4].nodes[0] = 1;
//   network.paths[4].nodes[1] = 4;

//   network.paths[5].index = 5;
//   network.paths[5].pin = 8;
//   network.paths[5].nodes[0] = 2;
//   network.paths[5].nodes[1] = 3;

//   network.paths[6].index = 6;
//   network.paths[6].pin = 9;
//   network.paths[6].nodes[0] = 2;
//   network.paths[6].nodes[1] = 4;

//   network.paths[7].index = 7;
//   network.paths[7].pin = 10;
//   network.paths[7].nodes[0] = 3;
//   network.paths[7].nodes[1] = 4;
//   return network;
// }