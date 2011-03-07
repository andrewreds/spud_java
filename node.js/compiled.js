function Emulator() {
  this.delay = 0
}
Emulator.prototype.canStateExecute = function(a) {
  return!a.isHalted
};
Emulator.prototype.step = function(a) {
  a.processor.pipeline.get(a.pipelineStep).run(a);
  a.pipelineStep = (a.pipelineStep + 1) % a.processor.pipeline.size();
  a.pipelineStep == 0 && a.executionStep++;
  a.isHalted && stop()
};
Emulator.prototype.run = function(a, g) {
  if(this.canStateExecute(a)) {
    this.state = a;
    repeatCount = g * a.processor.pipeline.size();
    for(i = 0;i < repeatCount && canStateExecute(a);i++) {
      step(this.state)
    }
  }
};
Emulator.prototype.stop = function() {
};
function Instruction(a, g) {
  this.description = a;
  this.ipIncrement = g
}
Instruction.prototype.execute = function() {
};
Instruction.prototype.getDescription = function() {
  return description
};
Instruction.prototype.getBytes = function() {
  return ipIncrement
};
function Processor() {
  this.setRegisterNames(["IP", "IS"])
}
Processor.prototype.getNumRegisters = function() {
  return this.registerNames.length
};
Processor.prototype.setRegisterNames = function(a) {
  this.registerIndexLookup = {};
  this.registerNames = a;
  var g = false, h = false;
  for(i = 0;i != a.length;i++) {
    var k = a[i];
    this.registerIndexLookup[k] = i;
    if(k == "IP") {
      g = true
    }else {
      if(k == "IS") {
        h = true
      }
    }
  }
  if(!g || !h) {
    throw Error("Processor must have IP and IS registers");
  }
};
Processor.prototype.getRegisterNames = function() {
  return this.registerNames
};
Processor.prototype.getJSON = function() {
  var a = "";
  a += "{\n";
  a += '    "name": "';
  a += name;
  a += '",\n';
  a += '    "memorysize": ';
  a += numMemoryAddresses;
  a += ",\n";
  a += '    "registers": [';
  var g = true, h;
  for(h in this.registerNames) {
    g || (a += ",");
    g = false;
    a += '"';
    a += this.registerNames[h];
    a += '"'
  }
  a += "],\n";
  a += '    "instructions": [\n';
  for(g = 0;g < this.instructions.length;g++) {
    h = this.instructions[g];
    if(h != null) {
      a += "        [";
      a += g;
      a += ", ";
      a += h.getBytes();
      a += ', "';
      a += h.getDescription();
      a += '"]';
      if(g != instructions.length - 1) {
        a += ","
      }
      a += "\n"
    }
  }
  a += "    ]\n";
  a += "}";
  return a
};
function FetchIncExecProcessor() {
  this.__proto__.__proto__.constructor();
  this.pipeline = [];
  this.fetch = {run:function(a) {
    FetchIncExecProcessor.fetch(a)
  }};
  this.pipeline[0] = this.fetch;
  this.increment = {run:function(a) {
    FetchIncExecProcessor.increment(a)
  }};
  this.pipeline[1] = this.increment;
  this.execute = {run:function(a) {
    FetchIncExecProcessor.execute(a)
  }};
  this.pipeline[2] = this.execute
}
FetchIncExecProcessor.prototype = new Processor;
FetchIncExecProcessor.prototype.fetch = function(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g);
  a.setRegister("IS", g)
};
FetchIncExecProcessor.prototype.increment = function(a) {
  var g = a.getRegister("IP"), h = a.getRegister("IS"), k = null;
  if(h < a.processor.instructions.size()) {
    k = a.processor.instructions.get(h)
  }
  h = k == null ? 1 : k.getBytes();
  a.setRegister("IP", g + h)
};
FetchIncExecProcessor.prototype.execute = function(a) {
  var g = a.getRegister("IS"), h = null;
  if(g < a.processor.instructions.size()) {
    h = a.processor.instructions.get(g)
  }
  h != null && h.execute(a)
};
function SimpleRunner() {
}
SimpleRunner.prototype.run = function(a, g, h) {
  g = new InterpretedProcessor(g);
  g = new State(g);
  g.setAllMemory(a);
  (new Emulator).run(g, h);
  return g.toJSON()
};
function State(a) {
  this.processor = a;
  this.isHalted = false;
  this.output = "";
  this.numBellRings = 0;
  this.memory = [];
  this.registers = [];
  var g;
  for(g = 0;g != a.numMemoryAddresses;g++) {
    this.memory[g] = 0
  }
  for(g = 0;g != a.getNumRegisters();g++) {
    this.registers[g] = 0
  }
  this.reset()
}
State.prototype.duplicate = function() {
  var a = new State(this.processor);
  a.setAllMemory(this.memory);
  a.setAllRegisters(this.registers);
  a.isHalted = this.isHalted;
  a.output = this.output;
  a.numBellRings = this.numBellRings;
  a.pipelineStep = this.pipelineStep;
  a.executionStep = this.executionStep;
  return a
};
State.prototype.reset = function() {
  var a;
  for(a = 0;a != this.processor.numMemoryAddresses;a++) {
    this.memory[a] = 0
  }
  for(a = 0;a != this.processor.getNumRegisters();a++) {
    this.registers[a] = 0
  }
  this.isHalted = false;
  this.output = "";
  this.executionStep = this.pipelineStep = this.numBellRings = 0
};
State.prototype.constrainRegister = function(a) {
  return a & (1 << this.processor.registerBitSize) - 1
};
State.prototype.constrainMemory = function(a) {
  return a & (1 << this.processor.memoryBitSize) - 1
};
State.prototype.constrainAddress = function(a) {
  a %= this.processor.numMemoryAddresses;
  if(a < 0) {
    a += this.processor.numMemoryAddresses
  }
  return a
};
State.prototype.getRegister = function(a) {
  return this.constrainRegister(this.registers[this.processor.registerIndexLookup[a]])
};
State.prototype.setRegister = function(a, g) {
  this.registers[this.processor.registerIndexLookup[a]] = this.constrainRegister(g)
};
State.prototype.getMemory = function(a) {
  a = this.constrainAddress(a);
  return this.constrainMemory(this.memory[a])
};
State.prototype.setMemory = function(a, g) {
  a = this.constrainAddress(a);
  memory[a] = this.constrainMemory(g)
};
State.prototype.getAllMemory = function() {
  return this.memory.slice(0)
};
State.prototype.setAllMemory = function(a) {
  var g;
  for(g = 0;g != this.processor.numMemoryAddresses;g++) {
    memory[g] = g < a.length ? this.constrainMemory(a[g]) : 0
  }
};
State.prototype.setAllRegisters = function(a) {
  var g;
  for(g = 0;g != this.processor.getNumRegisters();g++) {
    registers[g] = g < a.lenght ? this.constrainRegister(a[g]) : 0
  }
};
State.prototype.print = function(a) {
  this.output += String(a)
};
State.prototype.printASCII = function(a) {
  this.output += String.fromCharCode(a)
};
State.prototype.ringBell = function() {
  this.numBellRings++
};
State.prototype.halt = function() {
  this.isHalted = true
};
State.prototype.toJSON = function() {
  var a = "";
  a += "{\n";
  a += '    "registers": {\n';
  var g = true, h;
  for(h in this.registerNames) {
    g || (a += ",");
    g = false;
    var k = this.registerNames[h];
    a += '        "';
    a += k;
    a += '": ';
    a += this.registers[this.processor.registerIndexLookup[k]];
    a += "\n"
  }
  a += "    },\n";
  a += '    "memory": [';
  g = true;
  for(memid in this.memory) {
    g || (a += ", ");
    g = false;
    k = this.memory[memid];
    a += String(k)
  }
  a += "],\n";
  a += '    "isHalted": ';
  a += String(this.isHalted);
  a += ",\n";
  a += '    "pipelineStep": ';
  a += String(this.pipelineStep);
  a += ",\n";
  a += '    "output": "';
  a += this.output;
  a += '",\n';
  a += '    "numBellRings": ';
  a += String(this.numBellRings);
  a += ",\n";
  a += '    "cycles": ';
  a += String(this.executionStep);
  a += "\n";
  a += "}";
  return a
};
function BuiltinInstruction(a, g, h) {
  this.description = a;
  this.ipIncrement = g;
  this.instruction = h
}
BuiltinInstruction.prototype.execute = function(a) {
  this.instruction(a)
};
BuiltinInstruction.prototype.getDescription = function() {
  return this.description
};
BuiltinInstruction.prototype.getBytes = function() {
  return this.ipIncrement
};
function Processor4917() {
  this.__proto__.__proto__.constructor();
  this.name = "4917";
  this.memoryBitSize = 4;
  this.numMemoryAddresses = 16;
  this.registerBitSize = 4;
  this.setRegisterNames(["IP", "IS", "R0", "R1"]);
  this.instructions = [new BuiltinInstruction("Halt", 1, InstructionHalt), new BuiltinInstruction("Add (R0 = R0 + R1)", 1, InstructionAdd), new BuiltinInstruction("Subtract (R0 = R0 - R1)", 1, InstructionSubtract), new BuiltinInstruction("Increment R0 (R0 = R0 + 1)", 1, InstructionIncrementR0), new BuiltinInstruction("Increment R1 (R1 = R1 + 1)", 1, InstructionIncrementR1), new BuiltinInstruction("Decrement R0 (R0 = R0 - 1)", 1, InstructionDecrementR0), new BuiltinInstruction("Decrement R1 (R1 = R1 - 1)", 
  1, InstructionDecrementR1), new BuiltinInstruction("Ring Bell", 1, InstructionRingBell), new BuiltinInstruction("Print <data> (numerical value is printed)", 2, InstructionPrint), new BuiltinInstruction("Load value at address <data> into R0", 2, InstructionLoadR0), new BuiltinInstruction("Load value at address <data> into R1", 2, InstructionLoadR1), new BuiltinInstruction("Store R0 into address <data>", 2, InstructionStoreR0), new BuiltinInstruction("Store R1 into address <data>", 2, InstructionStoreR1), 
  new BuiltinInstruction("Jump to address <data>", 2, InstructionJump), new BuiltinInstruction("Jump to address <data> if R0 == 0", 2, InstructionJumpIfR0is0), new BuiltinInstruction("Jump to address <data> if R0 != 0", 2, InstructionJumpIfR0not0)]
}
Processor4917.prototype = new FetchIncExecProcessor;
function InstructionHalt(a) {
  a.halt()
}
function InstructionAdd(a) {
  var g = a.getRegister("R0"), h = a.getRegister("R1");
  a.setRegister("R0", g + h)
}
function InstructionSubtract(a) {
  var g = a.getRegister("R0"), h = a.getRegister("R1");
  a.setRegister("R0", g - h)
}
function InstructionIncrementR0(a) {
  var g = a.getRegister("R0");
  a.setRegister("R0", g + 1)
}
function InstructionIncrementR1(a) {
  var g = a.getRegister("R1");
  a.setRegister("R1", g + 1)
}
function InstructionDecrementR0(a) {
  var g = a.getRegister("R0");
  a.setRegister("R0", g - 1)
}
function InstructionDecrementR1(a) {
  var g = a.getRegister("R1");
  a.setRegister("R1", g - 1)
}
function InstructionRingBell(a) {
  a.ringBell()
}
function InstructionPrint(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g - 1);
  a.print(g)
}
function InstructionLoadR0(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g - 1);
  a.setRegister("R0", a.getMemory(g))
}
function InstructionLoadR1(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g - 1);
  a.setRegister("R1", a.getMemory(g))
}
function InstructionStoreR0(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g - 1);
  a.setMemory(g, a.getRegister("R0"))
}
function InstructionStoreR1(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g - 1);
  a.setMemory(g, a.getRegister("R1"))
}
function InstructionJump(a) {
  var g = a.getRegister("IP");
  g = a.getMemory(g - 1);
  a.setRegister("IP", g)
}
function InstructionJumpIfR0is0(a) {
  if(a.getRegister("R0") == 0) {
    var g = a.getRegister("IP");
    g = a.getMemory(g - 1);
    a.setRegister("IP", g)
  }
}
function InstructionJumpIfR0not0(a) {
  if(a.getRegister("R0") != 0) {
    var g = a.getRegister("IP");
    g = a.getMemory(g - 1);
    a.setRegister("IP", g)
  }
}
;function AppletRunner() {
  this.processor = new Processor4917;
  this.state = new State(this.processor);
  this.emulator = new Emulator
}
AppletRunner.prototype.step = function() {
  this.emulator.step(state);
  return this.getState()
};
AppletRunner.prototype.clearState = function() {
  this.state = new State(this.processor);
  return this.getState()
};
AppletRunner.prototype.setMemory = function(a, g) {
  this.state.setMemory(a, g)
};
AppletRunner.prototype.setRegister = function(a, g) {
  this.state.setRegister(a, g)
};
AppletRunner.prototype.getState = function() {
  return this.state.toJSON()
};
AppletRunner.prototype.executeScript = function(a) {
  console.log(a)
};
AppletRunner.prototype.getProcessor = function() {
  return this.processor.getJSON()
};
AppletRunner.prototype.loadSPuD = function(a) {
  var g;
  try {
    this.processor = g = new InterpretedProcessor(a);
    this.state = new State(processor);
    this.emulator = new Emulator
  }catch(h) {
    executeScript("alert('Error parsing SPuD processor definition.');")
  }
  return this.getState()
};
console.log("Hello World");
console.log(new AppletRunner);
b = new Emulator;
c = new Instruction;
d = new Processor;
e = new FetchIncExecProcessor;
f = new SimpleRunner;
j = new State(new Processor4917);
console.log("Done :)");

