function dump () {
	var regnames = app.processor.getRegisterNames ();
	for (var i=0; i<regnames.length; i++) {
		console.log (regnames[i]+": "+app.state.getRegister (regnames[i]));
	}
	var memory = app.state.memory;
	for (var i=0; i<memory.length; i++) {
		console.log (i+": "+memory[i]);
	}
}

/*var app = new AppletRunner ( );
app.setMemory (0,1);

app.step();
app.step();
app.step();

dump();
alert ("Cool :) "+JSON.stringify(app.state));*/

var app = new AppletRunner ( );
var stdin = process.openStdin();
var memaddloc = 0;
console.log ("Welcome to the " + app.processor.name + " Emulator");
console.log ("enter \"help\" for more infomation");
stdin.on('data', function(chunk) {
	chunk = ''+chunk;
	
	commands = chunk.replace ("\n","").split (" ");
	if (commands.length > 0) {
		if (commands[0] == commands[0]*1) { 
			for (var i=0; i<commands.length; i++) {
				if (commands[i] == commands[i]*1) {
					app.setMemory (memaddloc, commands[i]*1);
					memaddloc ++;
				}
			}
		} else {
			if (commands[0] == "run") {
				var numruns = 1000;
				if (commands.length > 1 && commands[1]*1 > 0) numruns = commands[1]*1;
				app.run (numruns);
			} else if (commands[0] == "dump") {
				dump();
			} else if (commands[0] == "step") {
				app.step();
			} else if (commands[0] == "help") {
				console.log ("Commands: dump, step, run, <number>");
				console.log ("dump: Prints out all memory");
				console.log ("step: The microcontroler goes fored through one part of the cycle. 3 steps is required to run one instruction");
				console.log ("run <x>: Steps x times. is no x, steps 1000 times");
				console.log ("<number> sets the memory cells to the numbers");
			} else {
				console.log ("Command \""+commands[0]+"\" Not Found!!!");
			}
		}
	}
	if (app.state.isHalted) console.log ("HALTED.");
}) 