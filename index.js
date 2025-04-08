// The Address class extends Array and adds helper methods for matching and prefix-checking.
class Adress extends Array {
  // Compares this address with an “other” address. Returns the index at which they first differ.
  lowCompare(other = new Adress()) {
    let index;
    for (index = 0; index < Math.min(this.length, other.length); index++) {
      if (this[index] !== other[index]) {
        return index;
      }
    }
    return index;
  }

  // Returns true if this address exactly equals the other address.
  matchExact(other = new Adress()) {
    if (this.length !== other.length) return false;
    return this.every((val, idx) => val === other[idx]);
  }

  // Returns true if this address is a prefix of the other address.
  isPrefixOf(other = new Adress()) {
    if (this.length > other.length) return false;
    for (let i = 0; i < this.length; i++) {
      if (this[i] !== other[i]) return false;
    }
    return true;
  }
}

// The Packet class holds an address (route) and some data.
class Packet {
  constructor() {
    this.adress = new Adress();
    this.data = "";
  }
}

// The TreeNode class represents a node in the routing tree.
class TreeNode {
  constructor(name = "unnamed") {
    this.name = name; // Useful for logging which node handled the packet
    this.parent = null;
    this.parallel = []; // Alternative nodes at the same level (or nearby)
    this.children = {}; // Dictionary to hold children nodes.
    this.adress = new Adress();
    // Default callback simply logs which node received the data
    this.recieveCallBack = (data) => console.log(`${this.name} handled:`, data);
  }

  // Helper to add a child; sets the child's parent pointer.
  addChild(key, child) {
    this.children[key] = child;
    child.parent = this;
  }

  // The main method that initiates packet routing.
  on(packet = new Packet()) {
    // If this node's address exactly matches the packet address, it is the intended destination.
    if (this.adress.matchExact(packet.adress)) {
      this.recieveCallBack(packet.data);
      return;
    }

    // Check among children for a more specific matching route.
    let bestChild = null;
    let bestMatchLength = this.adress.length;
    for (const key in this.children) {
      const child = this.children[key];
      // Only consider children whose address is a prefix of the packet address.
      if (
        child.adress.isPrefixOf(packet.adress) &&
        child.adress.length > bestMatchLength
      ) {
        bestChild = child;
        bestMatchLength = child.adress.length;
      }
    }
    if (bestChild) {
      bestChild.on(packet);
      return;
    }

    // If no child can handle the packet, attempt to use a parallel route.
    this.navigate(packet);
  }

  // The navigate() method checks parallel nodes for a better match.
  navigate(packet = new Packet()) {
    // Compute how many address segments match at this node.
    let currentMatch = this.adress.lowCompare(packet.adress);
    let bestParallel = null;

    // Iterate over parallel nodes and choose one that has a longer matching prefix,
    // and whose route is a prefix of the packet address.
    for (const pNode of this.parallel) {
      let pMatch = pNode.adress.lowCompare(packet.adress);
      if (pMatch > currentMatch && pNode.adress.isPrefixOf(packet.adress)) {
        bestParallel = pNode;
        break;
      }
    }

    if (bestParallel) {
      bestParallel.on(packet);
    } else if (this.parent) {
      // If no parallel node was more specific, route to the parent's routing logic.
      this.parent.on(packet);
    } else {
      console.error(
        "No route found for packet:",
        packet.data,
        "with adress",
        packet.adress
      );
    }
  }
}

// ----------------------
// Example: Building a Routing Tree
// ----------------------

// Create the root node (represents the default/fall-back route)
const rootNode = new TreeNode("Root");
rootNode.adress = new Adress(); // Root node has an empty address.

// Create Node A with address [1] and add to root.
const nodeA = new TreeNode("Node A");
nodeA.adress = new Adress([1]);
rootNode.addChild("A", nodeA);

// Create Node B with address [2] and add to root.
const nodeB = new TreeNode("Node B");
nodeB.adress = new Adress([2]);
rootNode.addChild("B", nodeB);

// For demonstration, let Node A and Node B be parallel alternatives at root level.
// (This is optional, but shows that if a packet is misrouted via one branch, a parallel might correct it.)
nodeA.parallel.push(nodeB);
nodeB.parallel.push(nodeA);

// Create children for Node A.
const nodeA1 = new TreeNode("Node A1");
nodeA1.adress = new Adress([1, 1]);
nodeA.addChild("A1", nodeA1);

const nodeA2 = new TreeNode("Node A2");
nodeA2.adress = new Adress([1, 2]);
nodeA.addChild("A2", nodeA2);

// Create children for Node B.
const nodeB1 = new TreeNode("Node B1");
nodeB1.adress = new Adress([2, 1]);
nodeB.addChild("B1", nodeB1);

const nodeB2 = new TreeNode("Node B2");
nodeB2.adress = new Adress([2, 2]);
nodeB.addChild("B2", nodeB2);

// Create deeper levels if desired.
const nodeA1a = new TreeNode("Node A1a");
nodeA1a.adress = new Adress([1, 1, 1]);
nodeA1.addChild("A1a", nodeA1a);

// ----------------------
// Testing Routes
// ----------------------

console.log("Test 1: Packet for Node A1 (address: [1, 1])");
let p1 = new Packet();
p1.adress = new Adress([1, 1]);
p1.data = "Hello, Node A1!";
rootNode.on(p1);
// Expected: Routed from Root -> Node A -> Node A1

console.log("\nTest 2: Packet for Node A2 (address: [1, 2])");
let p2 = new Packet();
p2.adress = new Adress([1, 2]);
p2.data = "Hello, Node A2!";
rootNode.on(p2);
// Expected: Routed from Root -> Node A -> Node A2

console.log("\nTest 3: Packet for Node A1a (address: [1, 1, 1])");
let p3 = new Packet();
p3.adress = new Adress([1, 1, 1]);
p3.data = "Hello, Node A1a!";
rootNode.on(p3);
// Expected: Routed from Root -> Node A -> Node A1 -> Node A1a

console.log("\nTest 4: Packet for Node B1 (address: [2, 1])");
let p4 = new Packet();
p4.adress = new Adress([2, 1]);
p4.data = "Hello, Node B1!";
rootNode.on(p4);
// Expected: Routed from Root -> Node B -> Node B1

console.log(
  "\nTest 5: Packet sent to the wrong branch (starting at Node A) but a parallel route corrects it:"
);
let p5 = new Packet();
p5.adress = new Adress([2, 2]);
p5.data = "Hello, Node B2 via a parallel route!";
//
// Simulate a case where the packet might initially be handled by nodeA;
// for example, someone mistakenly sends a packet to nodeA and then nodeA uses its parallel branch.
nodeA.on(p5);
// Expected: Node A sees that its own adress ([1]) is not a match for [2,2] so it checks its parallel nodes.
// Since nodeB’s address ([2]) is a prefix for [2,2], nodeB should be used, and then Node B routes down to Node B2.
