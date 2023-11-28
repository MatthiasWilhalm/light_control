#ifndef NODE_H
#define NODE_H

struct LightNetwork {
    Path paths[8];
    Node nodes[5];
};

struct Node {
    int index;
    int paths[3];
};

struct Path {
    int index;
    int pin;
    int nodes[2];
};

#endif