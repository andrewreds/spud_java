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
  return this.description
};
Instruction.prototype.getBytes = function() {
  return this.ipIncrement
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
  this.processor = new InterpretedProcessor("name: 4004\nmemoryBitSize: 4\nnumMemoryAddresses: 16\nregisterBitSize: 4\nregisterNames: IP, IS, R0, R1, SW\n\n[descriptions]\n0: Halt\n1: Increment R0 (R0 = R0 + 1)\n2: Decrement R0 (R0 = R0 - 1)\n3: Increment R1 (R1 = R1 + 1)\n4: Decrement R1 (R1 = R1 - 1)\n5: Add (R0 = R0 + R1)\n6: Subtract (R0 = R0 - R1)\n7: Print R0\n8: Jump to address <data> if R0 != 0\n9: Jump to address <data> if R0 == 0\n10: Load <data> in to R0\n11: Load <data> in to R1\n12: Store R0 into address <data>\n13: Store R1 into address <data>\n14: Swap R0 and address <data>\n15: Swap R1 and address <data>\n\n[instructions]\n0, 1: halt.\n1, 1: R0++.\n2, 1: R0--.\n3, 1: R1++.\n4, 1: R1--.\n5, 1: R0 = R0 + R1.\n6, 1: R0 = R0 - R1.\n7, 1: print(R0).\n8, 2 case R0 != 0: IP = [IP-1].\n9, 2 case R0 == 0: IP = [IP-1].\n10, 2: R0 = [IP-1].\n11, 2: R1 = [IP-1].\n12, 2: [[IP-1]] = R0.\n13, 2: [[IP-1]] = R1.\n14, 2: SW = [[IP-1]]; [[IP-1]] = R0; R0 = SW.\n15, 2: SW = [[IP-1]]; [[IP-1]] = R1; R1 = SW.\n");
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
function Condition(a, b, c) {
  this.condition = a;
  this.statements = b;
  this.continuation = c
}
;function InterpretedInstruction(a, b, c) {
  this.description = a;
  this.ipIncrement = b;
  this.tokeniser = new Tokeniser;
  this.conditions = [];
  this.updateCode(c)
}
InterpretedInstruction.prototype = new Instruction;
InterpretedInstruction.prototype.removeWhitespace = function(a) {
  return a.replace(/\s/g, "")
};
InterpretedInstruction.prototype.addCondition = function(a, b, c) {
  a = this.tokeniser.tokenise(a);
  var d = [];
  b = b.split(Interpreter.statementSeparator);
  for(var e in b) {
    d.push(this.tokeniser.tokenise(b[e]))
  }
  this.conditions.push(new Condition(a, d, c))
};
InterpretedInstruction.prototype.updateCode = function(a) {
  a = this.removeWhitespace(a);
  this.conditions = [];
  var b = a.charAt(0);
  if(b == Interpreter.guardKeyword.charAt(0)) {
    a = a.substr(Interpreter.guardKeyword.length, a.length);
    b = Interpreter.guardKeyword
  }else {
    a = a.substring(1, a.length)
  }
  var c = a.split(Interpreter.helperKeyword);
  a = c[0];
  if(c.length > 1) {
    c = c[1].split(Interpreter.statementSeparator);
    this.where = {};
    for(var d in c) {
      if(c[d].length > 0) {
        var e = c[d].split("=");
        this.where.push(e[0], this.tokeniser.tokenise(e[1]))
      }
    }
  }
  if(b == Interpreter.conditionTerminator) {
    this.addCondition("true", a, false)
  }else {
    if(b == Interpreter.guardKeyword) {
      a = a.split(Interpreter.guardKeyword);
      for(b = 0;b != a.length;b++) {
        e = a[b].split(nterpreter.conditionTerminator);
        d = false;
        if(e.length == 1) {
          e = a[b].split("?");
          d = true
        }
        c = e[0];
        e = e[1];
        c.length > 0 && addCondition(c, e, d)
      }
    }
  }
};
InterpretedInstruction.prototype.execute = function(a) {
  for(var b in this.conditions) {
    if(Interpreter.prototype.interpretCondition(this.conditions[b].condition, a, this.where)) {
      var c = this.conditions[b].statements, d;
      for(d in c) {
        Interpreter.prototype.interpretStatement(c[d], a, this.where)
      }
      if(!this.conditions[b].continuation) {
        break
      }
    }
  }
};
function Interpreter(a, b, c) {
  this.state = b;
  this.tokens = a;
  this.where = c;
  this.pendingToken = this.acceptedToken = null;
  this.tokenPos = 0;
  this.internalAccessible = false;
  this.getToken()
}
Interpreter.guardKeyword = "case";
Interpreter.helperKeyword = "where";
Interpreter.pretestKeyword = "whenever";
Interpreter.statementSeparator = ";";
Interpreter.conditionTerminator = ":";
Interpreter.instructionPartSeparator = ",";
Interpreter.prototype.getToken = function() {
  if(this.tokenPos != this.tokens.length) {
    this.pendingToken = this.tokens[this.tokenPos];
    this.tokenPos++
  }else {
    this.pendingToken = null
  }
};
Interpreter.prototype.accept = function(a) {
  var b = false;
  if(this.pendingToken != null && this.pendingToken.type == a) {
    this.acceptedToken = this.pendingToken;
    this.getToken();
    b = true
  }
  return b
};
Interpreter.prototype.expect = function(a) {
  if(!this.accept(a)) {
    throw"Expected " + Token.typeString(a) + " but found " + pendingToken.typeToString();
  }
};
Interpreter.prototype.validRegister = function(a) {
  return this.state.processor.getRegisterNames().indexOf(a) != -1
};
Interpreter.prototype.bitExpression = function() {
  for(var a = this.addExpression();this.accept(Token.OpBitwise);) {
    if(this.acceptedToken.value == "^") {
      a ^= this.addExpression()
    }else {
      if(this.acceptedToken.value == "&") {
        a &= this.addExpression()
      }else {
        if(this.acceptedToken.value == "|") {
          a |= this.addExpression()
        }else {
          if(this.acceptedToken.value == ">>") {
            a >>= this.addExpression()
          }else {
            if(this.acceptedToken.value == "<<") {
              a <<= this.addExpression()
            }else {
              throw"Unknown bitwise operator: " + this.acceptedToken.value;
            }
          }
        }
      }
    }
  }
  return a
};
Interpreter.prototype.addExpression = function() {
  for(var a = this.mulExpression();this.accept(Token.OpTerm);) {
    if(this.acceptedToken.value == "+") {
      a += this.mulExpression()
    }else {
      if(this.acceptedToken.value == "-") {
        a -= this.mulExpression()
      }else {
        throw"Unknown additive operator: " + this.acceptedToken.value;
      }
    }
  }
  return a
};
Interpreter.prototype.mulExpression = function() {
  for(var a = this.unaryExpression();this.accept(Token.OpFactor);) {
    if(this.acceptedToken.value == "*") {
      a *= this.unaryExpression()
    }else {
      if(this.acceptedToken.value == "/") {
        a /= this.unaryExpression()
      }else {
        if(this.acceptedToken.value == "%") {
          a %= this.unaryExpression()
        }else {
          throw"Unknown multiplicative operator: " + this.acceptedToken.value;
        }
      }
    }
  }
  return a
};
Interpreter.prototype.unaryExpression = function() {
  var a = this.accept(Token.OpUnary), b = this.simpleExpression();
  if(a) {
    if(this.acceptedToken.value == "~") {
      b = ~b
    }else {
      throw"Unknown unary operator: " + this.acceptedToken.value;
    }
  }
  return b
};
Interpreter.prototype.simpleExpression = function() {
  var a = -1;
  if(this.accept(Token.GroupOpen)) {
    a = this.intExpression();
    this.expect(Token.GroupClose)
  }else {
    if(this.accept(Token.Integer)) {
      a = this.acceptedToken.value * 1
    }else {
      if(this.accept(Token.Hex)) {
        a = parseInt(this.acceptedToken.value, 16)
      }else {
        if(this.pendingToken.type == Token.RegisterName || this.pendingToken.type == Token.DerefOpen || this.pendingToken.type == Token.RegRefOpen) {
          a = this.identifier()
        }else {
          if(this.pendingToken != null) {
            throw"Unable to parse expression at: " + pendingToken.value;
          }
        }
      }
    }
  }
  return a
};
Interpreter.prototype.identifier = function() {
  var a = -1;
  if(this.accept(Token.RegisterName)) {
    a = this.acceptedToken.value;
    if(this.validRegister(a)) {
      a = this.state.getRegister(a)
    }else {
      if(this.where.containsKey(a)) {
        a = Interpreter.interpretExpression(this.where[a], this.state, this.where)
      }else {
        throw"Unknown register or 'where' identifier: " + a;
      }
    }
  }else {
    if(this.accept(Token.DerefOpen)) {
      a = this.intExpression();
      this.expect(Token.DerefClose);
      a = this.state.getMemory(a)
    }else {
      if(this.accept(Token.RegRefOpen)) {
        var b = this.intExpression();
        this.expect(Token.RegRefClose);
        if(b < this.state.processor.getNumRegisters()) {
          a = this.state.processor.getRegisterNames()[b];
          a = this.state.getRegister(a)
        }
      }else {
        if(this.accept(Token.Internal)) {
          if(this.internalAccessible) {
            if(this.acceptedToken.value == "numBellRings") {
              a = this.state.numBellRings
            }else {
              if(this.acceptedToken.value == "numCycles") {
                a = this.state.executionStep
              }else {
                throw"Unknown integer internal value";
              }
            }
          }else {
            throw"Internal information inaccessible";
          }
        }else {
          throw"Unrecognised identifier: " + pendingToken.value;
        }
      }
    }
  }
  return a
};
Interpreter.prototype.intExpression = function() {
  return this.bitExpression()
};
Interpreter.prototype.stringComparison = function() {
  var a;
  if(this.internalAccessible) {
    this.expect(Token.Internal);
    if(this.acceptedToken.value != "output") {
      throw"Unknown internal string identifier: " + this.acceptedToken.value;
    }
    this.expect(Token.OpComparison);
    if(this.acceptedToken.value == "==") {
      this.expect(Token.StringLiteral);
      a = this.state.output == this.acceptedToken.value
    }else {
      if(this.acceptedToken.value == "!=") {
        this.expect(Token.StringLiteral);
        a = this.state.output != this.acceptedToken.value
      }else {
        throw"Unknown string comparison operator: " + this.acceptedToken.value;
      }
    }
  }else {
    throw"Internal information inaccessible.";
  }
  return a
};
Interpreter.prototype.boolExpression = function() {
  var a;
  if(this.accept(Token.BoolLiteral)) {
    if(this.acceptedToken.value == "true" || this.acceptedToken.value == "otherwise") {
      a = true
    }else {
      if(this.acceptedToken.value == "false") {
        a = false
      }else {
        throw"Unknown boolean literal: " + this.acceptedToken.value;
      }
    }
  }else {
    if(this.accept(Token.GroupOpen)) {
      a = this.condition();
      this.expect(Token.GroupClose)
    }else {
      if(this.pendingToken.type == Token.Internal && this.pendingToken.value == "output") {
        a = this.stringComparison()
      }else {
        a = this.intExpression();
        this.expect(Token.OpComparison);
        var b = this.acceptedToken.value, c = this.intExpression();
        if(this.operator == ">") {
          a = a > c
        }else {
          if(this.operator == "<") {
            a = a < c
          }else {
            if(this.operator == ">=") {
              a = a >= c
            }else {
              if(this.operator == "<=") {
                a = a <= c
              }else {
                if(this.operator == "==") {
                  a = a == c
                }else {
                  if(b.equals("!=")) {
                    a = a != c
                  }else {
                    throw"Unknown comparison operator: " + b;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return a
};
Interpreter.prototype.condition = function() {
  for(var a = this.boolExpression();this.accept(Token.OpLogic);) {
    if(this.acceptedToken.value == "&&") {
      a = a && this.boolExpression()
    }else {
      if(this.acceptedToken.value == "||") {
        a = a || this.boolExpression()
      }else {
        throw"Unknown boolean operator: " + this.acceptedToken.value;
      }
    }
  }
  return a
};
Interpreter.prototype.assignment = function(a) {
  var b;
  if(this.accept(Token.OpAssign)) {
    var c = this.acceptedToken.value;
    b = this.intExpression();
    if(c == "+=") {
      b = a + b
    }else {
      if(c == "-=") {
        b = a - b
      }else {
        if(c != "=") {
          throw"Unknown assignment operator: " + this.acceptedToken.value;
        }
      }
    }
  }else {
    if(this.accept(Token.OpIncAssign)) {
      b = a;
      if(this.acceptedToken.value == "++") {
        b++
      }else {
        if(this.acceptedToken.value == "--") {
          b--
        }else {
          throw"Unknown increment operator: " + this.acceptedToken.value;
        }
      }
    }else {
      throw"Unknown assignment operator: " + pendingToken.value;
    }
  }
  return b
};
Interpreter.prototype.statement = function() {
  var a;
  if(this.accept(Token.RegisterName)) {
    var b = this.acceptedToken.value;
    if(this.validRegister(b)) {
      a = this.assignment(this.state.getRegister(b));
      this.state.setRegister(b, a)
    }else {
      throw"Unknown register name: " + b;
    }
  }else {
    if(this.accept(Token.DerefOpen)) {
      b = this.intExpression();
      this.expect(Token.DerefClose);
      a = this.assignment(this.state.getMemory(b));
      this.state.setMemory(b, a)
    }else {
      if(this.accept(Token.RegRefOpen)) {
        a = this.intExpression();
        this.expect(Token.RegRefClose);
        if(a < this.state.processor.getNumRegisters()) {
          b = this.state.processor.getRegisterNames().get(a);
          a = this.assignment(this.state.getRegister(b));
          this.state.setRegister(b, a)
        }
      }else {
        if(this.accept(Token.Keyword)) {
          if(this.acceptedToken.value == "print") {
            this.expect(Token.GroupOpen);
            this.argumentValue = this.intExpression();
            this.expect(Token.GroupClose);
            this.state.print(a)
          }else {
            if(this.acceptedToken.value == "printASCII") {
              this.expect(Token.GroupOpen);
              a = this.intExpression();
              this.expect(Token.GroupClose);
              this.state.printASCII(a)
            }else {
              if(this.acceptedToken.value == "bell") {
                this.state.ringBell()
              }else {
                if(this.acceptedToken.value == "halt") {
                  this.state.halt()
                }else {
                  if(this.acceptedToken.value != "nop") {
                    throw new InterpreterError("Unknown command: " + this.acceptedToken.value);
                  }
                }
              }
            }
          }
        }else {
          throw"Unable to parse statement, register name, memory address or command not found.";
        }
      }
    }
  }
};
Interpreter.prototype.interpretStatement = function(a, b, c) {
  (new Interpreter(a, b, c)).statement()
};
Interpreter.prototype.interpretCondition = function(a, b, c) {
  return(new Interpreter(a, b, c)).condition()
};
Interpreter.prototype.interpretExpression = function(a, b, c) {
  return(new Interpreter(a, b, c)).intExpression()
};
function InterpretedProcessor(a) {
  this.__proto__.__proto__.constructor();
  this.updateDefinition(a)
}
InterpretedProcessor.prototype = new FetchIncExecProcessor;
InterpretedProcessor.prototype.removeWhitespace = function(a) {
  return a.replace(/\s/g, "")
};
InterpretedProcessor.prototype.trim = function(a) {
  return a.replace(/^\s+|\s+$/g, "")
};
InterpretedProcessor.prototype.isTitleLine = function(a) {
  return this.trim(a) != "" && this.trim(a).charAt(0) == "["
};
InterpretedProcessor.prototype.addLineToDict = function(a, b) {
  if(this.trim(b) != "") {
    var c = b.split(":"), d = this.trim(c[0]);
    c = c.slice(1, c.length);
    c = this.trim(c.join(":"));
    a[d] = c
  }
};
InterpretedProcessor.prototype.isDigit = function(a) {
  return a >= "0" && a <= "9"
};
InterpretedProcessor.prototype.extractHeader = function(a) {
  var b = [], c, d;
  if(a.charAt(0) == Interpreter.instructionPartSeparator) {
    a = a.substr(1, a.lenght)
  }
  for(d = c = 0;c != a.length && a.charAt(c) != Interpreter.instructionPartSeparator;) {
    c++
  }
  b.push(a.substr(d, c) * 1);
  c++;
  for(d = c;c != a.length && this.isDigit(a.charAt(c));) {
    c++
  }
  b.push(a.substring(d, c) * 1);
  return b
};
InterpretedProcessor.prototype.extractCodeSection = function(a) {
  var b;
  for(b = 0;b != a.length;b++) {
    if(a.charAt(b) == Interpreter.conditionTerminator || a.substr(b, b + Interpreter.guardKeyword.length) == Interpreter.guardKeyword) {
      break
    }
  }
  return a.substring(b, a.length)
};
InterpretedProcessor.prototype.addInstructionCode = function(a, b) {
  var c, d, e, f;
  e = this.extractHeader(a);
  d = e[0];
  c = d + "";
  e = e[1];
  f = this.extractCodeSection(a);
  this.instructions[d] = new InterpretedInstruction(b[c], e, f)
};
InterpretedProcessor.prototype.updateDefinition = function(a) {
  var b = {}, c = {};
  this.instructions = [];
  a = a.split("\n");
  for(var d = 0;!this.isTitleLine(a[d]);) {
    this.addLineToDict(b, a[d]);
    d++
  }
  this.name = b.name;
  this.memoryBitSize = b.memoryBitSize * 1;
  this.numMemoryAddresses = b.numMemoryAddresses * 1;
  this.registerBitSize = b.registerBitSize * 1;
  var e = [];
  b = b.registerNames.split(",");
  for(var f in b) {
    e.push(this.trim(b[f]))
  }
  this.setRegisterNames(e);
  if(this.trim(a[d]) == "[descriptions]") {
    for(d++;!this.isTitleLine(a[d]);) {
      this.addLineToDict(c, a[d]);
      d++
    }
  }else {
    throw"Descriptions must be listed before instructions.";
  }
  if(this.trim(a[d]) == "[instructions]") {
    d++;
    f = a.slice(d, a.length).join();
    f = this.removeWhitespace(f)
  }else {
    throw"No Instruction Set Defined";
  }
  f = f.split(".");
  for(var g in f) {
    f[g] != "" && this.addInstructionCode(f[g], c)
  }
};
function Token(a, b) {
  this.type = a;
  this.value = b
}
Token.OpAssign = 0;
Token.OpLogic = 1;
Token.OpComparison = 2;
Token.BoolLiteral = 3;
Token.GroupOpen = 4;
Token.GroupClose = 5;
Token.OpTerm = 6;
Token.OpFactor = 7;
Token.Integer = 8;
Token.Keyword = 9;
Token.RegisterName = 10;
Token.DerefOpen = 11;
Token.DerefClose = 12;
Token.OpIncAssign = 13;
Token.OpBitwise = 14;
Token.OpUnary = 15;
Token.RegRefOpen = 16;
Token.RegRefClose = 17;
Token.Hex = 18;
Token.Internal = 19;
Token.StringLiteral = 20;
Token.prototype.typeString = function(a) {
  return["assignment", "logical operator", "logical comparison", "boolean literal", "open group", "close group", "term operator", "factor operator", "integer", "keyword", "register name", "open dereference", "close dereference", "modifying assignment", "bitwise operator", "unary operator", "register reference open", "register reference close", "hex hash"][a]
};
Token.prototype.toString = function() {
  return"(" + Token.typeString(this.type) + ', "' + this.value + '")'
};
Token.prototype.typeToString = function() {
  return Token.typeString(this.type)
};
function Tokeniser() {
  this.tokens = [];
  this.position = 0;
  this.code = ""
}
Tokeniser.prototype.addToken = function(a, b) {
  this.tokens.push(new Token(a, b));
  this.position += b.length
};
Tokeniser.prototype.throwError = function() {
  throw"unrecognised character at: " + this.code.charAt(this.position);
};
Tokeniser.prototype.tokeniseComparison = function() {
  var a = this.code.substring(position, position + 2), b = this.code.charAt(position);
  if(a == "<=" || a == ">=" || a == "!=" || a == "==") {
    this.addToken(Token.OpComparison, a)
  }else {
    if(b == "<" || b == ">") {
      this.addToken(Token.OpComparison, b)
    }
  }
};
Tokeniser.prototype.tokeniseEqualsSign = function() {
  var a = this.code.substring(this.position, this.position + 2);
  a == "==" ? this.addToken(Token.OpComparison, a) : this.addToken(Token.OpAssign, "=")
};
Tokeniser.prototype.tokeniseLogicOp = function() {
  var a = this.code.substring(this.position, this.position + 2), b = this.code.charAt(this.position);
  a == "&&" || a == "||" ? this.addToken(Token.OpLogic, a) : this.addToken(Token.OpBitwise, b)
};
Tokeniser.prototype.tokeniseBitshift = function() {
  var a = this.code.substring(this.position, this.position + 2);
  if(a == ">>" || a == "<<") {
    this.addToken(Token.OpBitwise, a)
  }else {
    throw"Unknown operator: " + a;
  }
};
Tokeniser.prototype.tokeniseAddOp = function() {
  var a = this.code.substr(this.position, this.position + 2), b = this.code.charAt(this.position);
  if(a == "+=" || a == "-=") {
    this.addToken(Token.OpAssign, a)
  }else {
    a == "++" || a == "--" ? this.addToken(Token.OpIncAssign, a) : this.addToken(Token.OpTerm, b)
  }
};
Tokeniser.prototype.isDigit = function(a) {
  return a >= "0" && a <= "9"
};
Tokeniser.prototype.isHexDigit = function(a) {
  return this.isDigit(a) || a >= "A" && a <= "F"
};
Tokeniser.prototype.isLetter = function(a) {
  return a == "_" || a >= "a" && a <= "z" || a >= "A" && a <= "Z"
};
Tokeniser.prototype.isAlphanumeric = function(a) {
  return this.isDigit(a) || this.isLetter(a)
};
Tokeniser.prototype.tokeniseInteger = function() {
  for(var a = "", b = this.position;b < this.code.length && this.isDigit(this.code.charAt(b));) {
    a += this.code.charAt(b);
    b++
  }
  this.addToken(Token.Integer, a)
};
Tokeniser.prototype.tokeniseHex = function() {
  var a = "";
  this.position++;
  for(var b = this.position;b < this.code.length && this.isHexDigit(this.code.charAt(b));) {
    a += this.code.charAt(b);
    b++
  }
  this.addToken(Token.Hex, a)
};
Tokeniser.prototype.tokeniseStringLiteral = function() {
  var a = this.position, b = "";
  for(a++;a < this.code.length && this.code.charAt(a) != '"';) {
    b += this.code.charAt(a);
    a++
  }
  this.addToken(Token.StringLiteral, b);
  this.position += 2
};
Tokeniser.prototype.tokeniseKeyword = function() {
  for(var a = "", b = this.position;b < this.code.length && this.isAlphanumeric(this.code.charAt(b));) {
    a += this.code.charAt(b);
    b++
  }
  b = {print:1, printASCII:2, bell:3, halt:4, nop:5};
  var c = {numBellRings:1, output:2, numCycles:3};
  if({"true":1, "false":2, otherwise:3}[a] != undefined) {
    this.addToken(Token.BoolLiteral, a)
  }else {
    if(b[a] != undefined) {
      this.addToken(Token.Keyword, a)
    }else {
      c[a] != undefined ? this.addToken(Token.Internal, a) : this.addToken(Token.RegisterName, a)
    }
  }
};
Tokeniser.prototype.tokenise = function(a) {
  this.code = a;
  this.tokens = [];
  for(this.position = 0;this.position != this.code.length;) {
    a = this.code.charAt(this.position);
    switch(a) {
      case "(":
        this.addToken(Token.GroupOpen, a);
        break;
      case ")":
        this.addToken(Token.GroupClose, a);
        break;
      case "[":
        this.addToken(Token.DerefOpen, a);
        break;
      case "]":
        this.addToken(Token.DerefClose, a);
        break;
      case "{":
        this.addToken(Token.RegRefOpen, a);
        break;
      case "}":
        this.addToken(Token.RegRefClose, a);
        break;
      case "*":
      ;
      case "/":
      ;
      case "%":
        this.addToken(Token.OpFactor, a);
        break;
      case "~":
        this.addToken(Token.OpUnary, a);
        break;
      case "+":
      ;
      case "-":
        this.tokeniseAddOp();
        break;
      case "<":
      ;
      case ">":
      ;
      case "!":
        this.code.charAt(this.position + 1) == a ? this.tokeniseBitshift() : this.tokeniseComparison();
        break;
      case "=":
        this.tokeniseEqualsSign();
        break;
      case "#":
        this.tokeniseHex();
        break;
      case "&":
      ;
      case "|":
      ;
      case "^":
        this.tokeniseLogicOp();
        break;
      case '"':
        this.tokeniseStringLiteral();
        break;
      default:
        if(this.isDigit(a)) {
          this.tokeniseInteger()
        }else {
          this.isLetter(a) ? this.tokeniseKeyword() : this.throwError()
        }
    }
  }
  return this.tokens
};
function dump() {
  for(var a = app.processor.getRegisterNames(), b = 0;b < a.length;b++) {
    console.log(a[b] + ": " + app.state.getRegister(a[b]))
  }
  a = app.state.memory;
  for(b = 0;b < a.length;b++) {
    console.log(b + ": " + a[b])
  }
}
var app = new AppletRunner, stdin = process.openStdin(), memaddloc = 0;
console.log("Welcome to the " + app.processor.name + " Emulator");
console.log('enter "help" for more infomation');
stdin.on("data", function(a) {
  commands = ("" + a).replace("\n", "").split(" ");
  if(commands.length > 0) {
    if(commands[0] == commands[0] * 1) {
      for(a = 0;a < commands.length;a++) {
        if(commands[a] == commands[a] * 1) {
          app.setMemory(memaddloc, commands[a] * 1);
          memaddloc++
        }
      }
    }else {
      if(commands[0] == "run") {
        a = 1E3;
        if(commands.length > 1 && commands[1] * 1 > 0) {
          a = commands[1] * 1
        }
        app.run(a)
      }else {
        if(commands[0] == "dump") {
          dump()
        }else {
          if(commands[0] == "step") {
            app.step()
          }else {
            if(commands[0] == "help") {
              console.log("Commands: dump, step, run, <number>");
              console.log("dump: Prints out all memory");
              console.log("step: The microcontroler goes fored through one part of the cycle. 3 steps is required to run one instruction");
              console.log("run <x>: Steps x times. is no x, steps 1000 times");
              console.log("<number> sets the memory cells to the numbers")
            }else {
              console.log('Command "' + commands[0] + '" Not Found!!!')
            }
          }
        }
      }
    }
  }
  app.state.isHalted && console.log("HALTED.")
});

//done. 
