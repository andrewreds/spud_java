function Emulator() {
  this.delay = 0
}
Emulator.prototype.canStateExecute = function(a) {
  return!a.isHalted
};
Emulator.prototype.step = function(a) {
  a.processor.pipeline[a.pipelineStep].run(a);
  a.pipelineStep = (a.pipelineStep + 1) % a.processor.pipeline.length;
  a.pipelineStep == 0 && a.executionStep++;
  a.isHalted && this.stop()
};
Emulator.prototype.run = function(a, b) {
  if(this.canStateExecute(a)) {
    this.state = a;
    repeatCount = b * a.processor.pipeline.length;
    for(i = 0;i < repeatCount && this.canStateExecute(a);i++) {
      this.step(this.state)
    }
  }
};
Emulator.prototype.stop = function() {
};
function Instruction(a, b) {
  this.description = a;
  this.ipIncrement = b
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
  var b = false, c = false;
  for(i = 0;i != a.length;i++) {
    var d = a[i];
    this.registerIndexLookup[d] = i;
    if(d == "IP") {
      b = true
    }else {
      if(d == "IS") {
        c = true
      }
    }
  }
  if(!b || !c) {
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
  var b = true, c;
  for(c in this.registerNames) {
    b || (a += ",");
    b = false;
    a += '"';
    a += this.registerNames[c];
    a += '"'
  }
  a += "],\n";
  a += '    "instructions": [\n';
  for(b = 0;b < this.instructions.length;b++) {
    c = this.instructions[b];
    if(c != null) {
      a += "        [";
      a += b;
      a += ", ";
      a += c.getBytes();
      a += ', "';
      a += c.getDescription();
      a += '"]';
      if(b != instructions.length - 1) {
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
    FetchIncExecProcessor.prototype.fetch(a)
  }};
  this.pipeline[0] = this.fetch;
  this.increment = {run:function(a) {
    FetchIncExecProcessor.prototype.increment(a)
  }};
  this.pipeline[1] = this.increment;
  this.execute = {run:function(a) {
    FetchIncExecProcessor.prototype.execute(a)
  }};
  this.pipeline[2] = this.execute
}
FetchIncExecProcessor.prototype = new Processor;
FetchIncExecProcessor.prototype.fetch = function(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b);
  a.setRegister("IS", b)
};
FetchIncExecProcessor.prototype.increment = function(a) {
  var b = a.getRegister("IP"), c = a.getRegister("IS"), d = null;
  if(c < a.processor.instructions.length) {
    d = a.processor.instructions[c]
  }
  c = d == null ? 1 : d.getBytes();
  a.setRegister("IP", b + c)
};
FetchIncExecProcessor.prototype.execute = function(a) {
  var b = a.getRegister("IS"), c = null;
  if(b < a.processor.instructions.length) {
    c = a.processor.instructions[b]
  }
  if(c != null) {
    c.execute(a)
  }else {
    throw error;
  }
};
function SimpleRunner() {
}
SimpleRunner.prototype.run = function(a, b, c) {
  b = new InterpretedProcessor(b);
  b = new State(b);
  b.setAllMemory(a);
  (new Emulator).run(b, c);
  return b.toJSON()
};
function State(a) {
  this.processor = a;
  this.isHalted = false;
  this.output = "";
  this.numBellRings = 0;
  this.memory = [];
  this.registers = [];
  var b;
  for(b = 0;b != a.numMemoryAddresses;b++) {
    this.memory[b] = 0
  }
  for(b = 0;b != a.getNumRegisters();b++) {
    this.registers[b] = 0
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
State.prototype.setRegister = function(a, b) {
  this.registers[this.processor.registerIndexLookup[a]] = this.constrainRegister(b)
};
State.prototype.getMemory = function(a) {
  a = this.constrainAddress(a);
  return this.constrainMemory(this.memory[a])
};
State.prototype.setMemory = function(a, b) {
  a = this.constrainAddress(a);
  this.memory[a] = this.constrainMemory(b)
};
State.prototype.getAllMemory = function() {
  return this.memory.slice(0)
};
State.prototype.setAllMemory = function(a) {
  var b;
  for(b = 0;b != this.processor.numMemoryAddresses;b++) {
    memory[b] = b < a.length ? this.constrainMemory(a[b]) : 0
  }
};
State.prototype.setAllRegisters = function(a) {
  var b;
  for(b = 0;b != this.processor.getNumRegisters();b++) {
    registers[b] = b < a.lenght ? this.constrainRegister(a[b]) : 0
  }
};
State.prototype.print = function(a) {
  this.output += String(a)
};
State.prototype.printASCII = function(a) {
  this.output += String.fromCharCode(a)
};
State.prototype.ringBell = function() {
  console.log("**DING**");
  this.numBellRings++
};
State.prototype.halt = function() {
  this.isHalted = true
};
State.prototype.toJSON = function() {
  var a = "";
  a += "{\n";
  a += '    "registers": {\n';
  var b = true, c;
  for(c in this.registerNames) {
    b || (a += ",");
    b = false;
    var d = this.registerNames[c];
    a += '        "';
    a += d;
    a += '": ';
    a += this.registers[this.processor.registerIndexLookup[d]];
    a += "\n"
  }
  a += "    },\n";
  a += '    "memory": [';
  b = true;
  for(memid in this.memory) {
    b || (a += ", ");
    b = false;
    d = this.memory[memid];
    a += String(d)
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
function BuiltinInstruction(a, b, c) {
  this.description = a;
  this.ipIncrement = b;
  this.instruction = c
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
  var b = a.getRegister("R0"), c = a.getRegister("R1");
  a.setRegister("R0", b + c)
}
function InstructionSubtract(a) {
  var b = a.getRegister("R0"), c = a.getRegister("R1");
  a.setRegister("R0", b - c)
}
function InstructionIncrementR0(a) {
  var b = a.getRegister("R0");
  a.setRegister("R0", b + 1)
}
function InstructionIncrementR1(a) {
  var b = a.getRegister("R1");
  a.setRegister("R1", b + 1)
}
function InstructionDecrementR0(a) {
  var b = a.getRegister("R0");
  a.setRegister("R0", b - 1)
}
function InstructionDecrementR1(a) {
  var b = a.getRegister("R1");
  a.setRegister("R1", b - 1)
}
function InstructionRingBell(a) {
  a.ringBell()
}
function InstructionPrint(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b - 1);
  a.print(b)
}
function InstructionLoadR0(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b - 1);
  a.setRegister("R0", a.getMemory(b))
}
function InstructionLoadR1(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b - 1);
  a.setRegister("R1", a.getMemory(b))
}
function InstructionStoreR0(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b - 1);
  a.setMemory(b, a.getRegister("R0"))
}
function InstructionStoreR1(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b - 1);
  a.setMemory(b, a.getRegister("R1"))
}
function InstructionJump(a) {
  var b = a.getRegister("IP");
  b = a.getMemory(b - 1);
  a.setRegister("IP", b)
}
function InstructionJumpIfR0is0(a) {
  if(a.getRegister("R0") == 0) {
    var b = a.getRegister("IP");
    b = a.getMemory(b - 1);
    a.setRegister("IP", b)
  }
}
function InstructionJumpIfR0not0(a) {
  if(a.getRegister("R0") != 0) {
    var b = a.getRegister("IP");
    b = a.getMemory(b - 1);
    a.setRegister("IP", b)
  }
}
;function AppletRunner() {
  this.processor = new Processor4917;
  this.state = new State(this.processor);
  this.emulator = new Emulator
}
AppletRunner.prototype.step = function() {
  this.emulator.step(this.state);
  return this.getState()
};
AppletRunner.prototype.run = function(a) {
  this.emulator.run(this.state, a);
  return this.getState()
};
AppletRunner.prototype.clearState = function() {
  this.state = new State(this.processor);
  return this.getState()
};
AppletRunner.prototype.setMemory = function(a, b) {
  this.state.setMemory(a, b)
};
AppletRunner.prototype.setRegister = function(a, b) {
  this.state.setRegister(a, b)
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
  var b;
  try {
    this.processor = b = new InterpretedProcessor(a);
    this.state = new State(processor);
    this.emulator = new Emulator
  }catch(c) {
    executeScript("alert('Error parsing SPuD processor definition.');")
  }
  return this.getState()
};
var app = new AppletRunner;
app.setMemory(0, 7);
app.run(1E3);

