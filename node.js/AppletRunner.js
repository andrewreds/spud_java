function AppletRunner ( ) {
	//this.processor = new Processor4917 ( );
	this.processor = new InterpretedProcessor ('name: 4004\n'+
'memoryBitSize: 4\n'+
'numMemoryAddresses: 16\n'+
'registerBitSize: 4\n'+
'registerNames: IP, IS, R0, R1, SW\n'+
'\n'+
'[descriptions]\n'+
'0: Halt\n'+
'1: Increment R0 (R0 = R0 + 1)\n'+
'2: Decrement R0 (R0 = R0 - 1)\n'+
'3: Increment R1 (R1 = R1 + 1)\n'+
'4: Decrement R1 (R1 = R1 - 1)\n'+
'5: Add (R0 = R0 + R1)\n'+
'6: Subtract (R0 = R0 - R1)\n'+
'7: Print R0\n'+
'8: Jump to address <data> if R0 != 0\n'+
'9: Jump to address <data> if R0 == 0\n'+
'10: Load <data> in to R0\n'+
'11: Load <data> in to R1\n'+
'12: Store R0 into address <data>\n'+
'13: Store R1 into address <data>\n'+
'14: Swap R0 and address <data>\n'+
'15: Swap R1 and address <data>\n'+
'\n'+
'[instructions]\n'+
'0, 1: halt.\n'+
'1, 1: R0++.\n'+
'2, 1: R0--.\n'+
'3, 1: R1++.\n'+
'4, 1: R1--.\n'+
'5, 1: R0 = R0 + R1.\n'+
'6, 1: R0 = R0 - R1.\n'+
'7, 1: print(R0).\n'+
'8, 2 case R0 != 0: IP = [IP-1].\n'+
'9, 2 case R0 == 0: IP = [IP-1].\n'+
'10, 2: R0 = [IP-1].\n'+
'11, 2: R1 = [IP-1].\n'+
'12, 2: [[IP-1]] = R0.\n'+
'13, 2: [[IP-1]] = R1.\n'+
'14, 2: SW = [[IP-1]]; [[IP-1]] = R0; R0 = SW.\n'+
'15, 2: SW = [[IP-1]]; [[IP-1]] = R1; R1 = SW.\n');
	this.state = new State ( this.processor );
	this.emulator = new Emulator ( );
}

// Javascript interface functions:
AppletRunner.prototype.step = function( ) {
	this.emulator.step( this.state );
	return this.getState( );
}

AppletRunner.prototype.run = function( numCommands ) {
	this.emulator.run( this.state , numCommands);
	return this.getState( );
}

AppletRunner.prototype.clearState = function( ){
	this.state = new State(this.processor);
	return this.getState( );
}

AppletRunner.prototype.setMemory = function( address, value ) {
	this.state.setMemory( address, value );
}

AppletRunner.prototype.setRegister = function( register, value ) {
	this.state.setRegister( register, value );
}

AppletRunner.prototype.getState = function( ) {
	return this.state.toJSON();
}

AppletRunner.prototype.executeScript = function( javascript ) {
	console.log (javascript);
	/*try {
		getAppletContext().showDocument( new URL( "javascript:" + javascript ) );
	} catch ( MalformedURLException e ) {
		// Auto-generated catch block
		e.printStackTrace();
	}*/
}

AppletRunner.prototype.getProcessor = function( ) {
	return this.processor.getJSON( );
}

AppletRunner.prototype.loadSPuD = function( definition ) {
	var trialProcessor;
	try {
		trialProcessor = new InterpretedProcessor( definition );
		// if there are no errors:
		this.processor = trialProcessor;
		this.state = new State( processor );
		this.emulator = new Emulator( );
	} catch (e) {
		executeScript("alert('Error parsing SPuD processor definition.');");
	}
	
	return this.getState( );
}




/*package emulator;

//import netscape.javascript.*;
import java.applet.*;
import java.awt.*;
import emulator.builtin.*;
import emulator.interpreter.*;

import java.net.*;

public class AppletRunner extends Applet {
    private static final long serialVersionUID = 7209576351844103952L;

	private Processor processor;
	private State state;
	private Emulator emulator;
	
	public void init( ) {
		processor = new Processor4917( );
		state = new State( processor );
		emulator = new Emulator( );
    }

    public void paint( Graphics g ) {
		g.drawString( "Yay! Graphics!", 50, 25 );
	}

    
	// Javascript interface functions:
	public String step( ) {
		emulator.step( state );
		return getState( );
	}
    
	public String clearState( ){
		state = new State(processor);
		return getState( );
	}
	
	public void setMemory( int address, int value ) {
		state.setMemory( address, value );
	}
	
	public void setRegister( String register, int value ) {
		state.setRegister( register, value );
	}
	
	public String getState( ) {
		return state.toJSON();
	}
    
	public void executeScript( String javascript ) {
		try {
			getAppletContext().showDocument( new URL( "javascript:" + javascript ) );
		} catch ( MalformedURLException e ) {
			// Auto-generated catch block
			e.printStackTrace();
		}
	}
	
    public String getProcessor( ) {
    	return processor.getJSON( );
    }
    
    public String loadSPuD( String definition ) {
    	Processor trialProcessor;
		try {
			trialProcessor = new InterpretedProcessor( definition );
			// if there are no errors:
			this.processor = trialProcessor;
			this.state = new State( processor );
			this.emulator = new Emulator( );
		} catch (InterpreterError e) {
			executeScript("alert('Error parsing SPuD processor definition.');");
		}
    	
    	return getState( );
    }
}
*/