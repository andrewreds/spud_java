java -jar ..\..\closure\compiler.jar --js_output_file compiled.js  --formatting PRETTY_PRINT --js Emulator.js --js Instruction.js --js Processor.js --js FetchIncExecProcessor.js --js SimpleRunner.js --js State.js --js builtin\BuiltinInstruction.js --js builtin\Processor4917.js --js AppletRunner.js --js interpreter\Condition.js --js interpreter\InterpretedInstruction.js --js interpreter\Interpreter.js --js interpreter\InterpretedProcessor.js --js interpreter\Token.js --js interpreter\Tokeniser.js --js main.js

pause


echo //done. >> compiled.js 