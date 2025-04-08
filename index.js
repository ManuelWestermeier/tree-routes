// Custom Adress class that extends Array and handles array constructor arguments.
class Adress extends Array {
  constructor(arg) {
    // Wenn kein Argument übergeben wurde, ein leeres Array erstellen.
    if (arg === undefined) {
      super();
    } else if (Array.isArray(arg)) {
      // Erzeuge ein leeres Array und füge dann die Elemente hinzu.
      super();
      this.push(...arg);
    } else {
      super(arg);
    }
  }

  // Returns the first index at which this address and 'other' differ.
  lowCompare(other = new Adress()) {
    let index;
    const minLen = Math.min(this.length, other.length);
    for (index = 0; index < minLen; index++) {
      if (this[index] !== other[index]) {
        return index;
      }
    }
    return index;
  }

  // Checks if this address exactly equals the other address.
  matchExact(other = new Adress()) {
    if (this.length !== other.length) return false;
    return this.every((val, idx) => val === other[idx]);
  }

  // Checks if this address is a prefix of the other address.
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
    this.adress = new Adress(); // Jetzt ein leeres Array statt [undefined]
    this.data = "";
  }
}

// The TreeNode class represents a node in our routing tree.
class TreeNode {
  constructor(name = "unnamed") {
    this.name = name; // A human-readable name.
    this.parent = null;
    this.parallel = []; // Parallel nodes for alternative routes.
    this.children = {}; // Dictionary of children.
    this.adress = new Adress(); // The address for this node.
    // Default callback: log which node handled the packet.
    this.recieveCallBack = (data) => console.log(`${this.name} handled:`, data);
  }

  // Helper to add a child node.
  addChild(key, child) {
    this.children[key] = child;
    child.parent = this;
  }

  // Main method to try to process a packet.
  on(packet = new Packet()) {
    // If addresses are an exact match, handle the packet here.
    if (this.adress.matchExact(packet.adress)) {
      this.recieveCallBack(packet.data);
      return;
    }

    // See if any child node has a more specific (longer) route matching the packet.
    let bestChild = null;
    let bestMatchLength = this.adress.length;
    for (const key in this.children) {
      const child = this.children[key];
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

    // No better child: try parallel routes.
    this.navigate(packet);
  }

  // Checks parallel nodes and possibly falls back to the parent.
  navigate(packet = new Packet()) {
    let currentMatch = this.adress.lowCompare(packet.adress);
    let bestParallel = null;

    // Look for a parallel node with a longer matching prefix.
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
// Build a Routing Tree (with more examples)
// ----------------------

// Create the root node with an empty address.
const rootNode = new TreeNode("Root");
rootNode.adress = new Adress(); // Leerer Pfad.

// Create two main branches.
const nodeA = new TreeNode("Node A");
nodeA.adress = new Adress([1]);
rootNode.addChild("A", nodeA);

const nodeB = new TreeNode("Node B");
nodeB.adress = new Adress([2]);
rootNode.addChild("B", nodeB);

// (Optional) Let Node A and Node B be parallel alternatives.
nodeA.parallel.push(nodeB);
nodeB.parallel.push(nodeA);

// Children for Node A.
const nodeA1 = new TreeNode("Node A1");
nodeA1.adress = new Adress([1, 1]);
nodeA.addChild("A1", nodeA1);

const nodeA2 = new TreeNode("Node A2");
nodeA2.adress = new Adress([1, 2]);
nodeA.addChild("A2", nodeA2);

// Children for Node B.
const nodeB1 = new TreeNode("Node B1");
nodeB1.adress = new Adress([2, 1]);
nodeB.addChild("B1", nodeB1);

const nodeB2 = new TreeNode("Node B2");
nodeB2.adress = new Adress([2, 2]);
nodeB.addChild("B2", nodeB2);

// Deeper node in branch A1.
const nodeA1a = new TreeNode("Node A1a");
nodeA1a.adress = new Adress([1, 1, 1]);
nodeA1.addChild("A1a", nodeA1a);

// ----------------------
// Testing Various Routes
// ----------------------

console.log("Test 1: Packet for Node A1 (address: [1, 1])");
let p1 = new Packet();
p1.adress = new Adress([1, 1]);
p1.data = "Hello, Node A1!";
rootNode.on(p1);
// Expected route: Root -> Node A -> Node A1

console.log("\nTest 2: Packet for Node A2 (address: [1, 2])");
let p2 = new Packet();
p2.adress = new Adress([1, 2]);
p2.data = "Hello, Node A2!";
rootNode.on(p2);
// Expected route: Root -> Node A -> Node A2

console.log("\nTest 3: Packet for Node A1a (address: [1, 1, 1])");
let p3 = new Packet();
p3.adress = new Adress([1, 1, 1]);
p3.data = "Hello, Node A1a!";
rootNode.on(p3);
// Expected route: Root -> Node A -> Node A1 -> Node A1a

console.log("\nTest 4: Packet for Node B1 (address: [2, 1])");
let p4 = new Packet();
p4.adress = new Adress([2, 1]);
p4.data = "Hello, Node B1!";
rootNode.on(p4);
// Expected route: Root -> Node B -> Node B1

console.log(
  "\nTest 5: Packet sent to the wrong branch (should be corrected via parallel routing):"
);
let p5 = new Packet();
p5.adress = new Adress([2, 2]);
p5.data = "Hello, Node B2 via a parallel route!";
// Simuliere, dass der Start von Node A erfolgt:
nodeA.on(p5);
// Expected: Node A erkennt, dass [1] kein Match für [2, 2] ist, leitet über den parallelen Node B weiter und erreicht Node B2.
