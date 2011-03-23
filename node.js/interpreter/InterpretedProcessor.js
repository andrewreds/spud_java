function InterpretedProcessor( definition ) {
	//super()
	this.__proto__.__proto__.constructor();
	
	this.updateDefinition( definition );
}

InterpretedProcessor.prototype = new FetchIncExecProcessor;


InterpretedProcessor.prototype.removeWhitespace = function ( code ) {
	// replace one or more whitespace chars with a nothing
	return code.replace( /\s/g, "" );
}

InterpretedProcessor.prototype.trim = function ( str ) {
	return str.replace(/^\s+|\s+$/g,"");
}

InterpretedProcessor.prototype.isTitleLine = function ( line ) {
	return ( this.trim( line ) != "" && this.trim( line ).charAt( 0 ) == '[');
}

InterpretedProcessor.prototype.addLineToDict = function ( dict, line ) {
	//trace( " InterpretedProcessor.addLineToDict" );
	//trace( "  trimmed line: " + trim( line ) );
	if ( this.trim( line ) != "" ) {
	
            //ArrayList<String> property = new ArrayList<String>( Arrays.asList( line.split( ":" ) ) );
            //String key = trim( property.get(0) );
            
            //property = new ArrayList<String>( property.subList( 1, property.size() ) );
            //String value = trim( Strings.join( property, ":" ) ); // TODO
			
		var property = line.split( ":" );
		var key = this.trim( property[0] );
		
		property = property.slice( 1, property.length );
		var value = this.trim( property.join( ":" ) ); // TODO
		
		//trace( "  key: " + key + ", value: " + value );

		dict[key] = value;
	}
}

InterpretedProcessor.prototype.isDigit = function ( c ) {
	return ( c >= '0' && c <= '9' );
}

InterpretedProcessor.prototype.extractHeader = function ( code ) {
	var header = [];
	var i;
	var start, end;

	if (code.charAt (0) == Interpreter.instructionPartSeparator) {
		code = code.substr (1, code.lenght);
	}
	i = 0;
	start = i;
	while ( i != code.length && code.charAt( i ) != Interpreter.instructionPartSeparator ) {
		i++;
	}
	
	end = i;
	header.push( code.substr( start, end )*1 );
	
	i++; // skip separator char
	start = i;
	while ( i != code.length && this.isDigit( code.charAt( i ) ) ) {
		i++;
	}
	
	end = i;
	header.push( code.substring( start, end )*1 );
	
	return header;
}

InterpretedProcessor.prototype.extractCodeSection = function ( code ) {
	var codeStart;
	for ( codeStart = 0; codeStart != code.length; codeStart++ ) {
		// or detect case statement
		if ( code.charAt( codeStart ) == Interpreter.conditionTerminator
			|| code.substr( codeStart, codeStart + Interpreter.guardKeyword.length ) == Interpreter.guardKeyword ) {
			break;
		}
	}
	return code.substring( codeStart, code.length );
}


InterpretedProcessor.prototype.addInstructionCode = function ( code, descriptions ) {
	var instrNumStr;
	var instrNum;
	var ipInc;
	var instrCode;
	
	var headerParts = this.extractHeader( code );
	instrNum = headerParts[0];
	instrNumStr = instrNum+'';
	ipInc = headerParts[1];
	
	instrCode = this.extractCodeSection( code );
	
	//trace( "[InterpretedProcessor.addInstructionCode] code: " + code );
	//trace( "[InterpretedProcessor.addInstructionCode] instrNumStr: " + instrNumStr );
	//trace( "[InterpretedProcessor.addInstructionCode] ipInc: " + ipInc );
	//trace( "[InterpretedProcessor.addInstructionCode] instrCode: " + instrCode );
	
	// because java won't let you set past the end of an arraylist
	//while (this.instructions.size() <= instrNum) {
	//	this.instructions.add(null);
	//}
	this.instructions[instrNum] = new InterpretedInstruction( descriptions[instrNumStr], ipInc, instrCode );
}

InterpretedProcessor.prototype.updateDefinition = function ( definition ) {
	
	var properties = {};
	var descriptions = {};
	
	this.instructions = [];
	
	var lines =  definition.split( "\n" );
	var lineNum = 0;
	
	while ( !this.isTitleLine( lines[lineNum] ) ) {
		// up until next [ ] heading
		
		this.addLineToDict( properties, lines[lineNum] );
		
		lineNum++;
	}
	// {{ lines[lineNum] starts with '[' }}
	
	this.name = properties["name"];
	this.memoryBitSize = properties["memoryBitSize"]*1;
	this.numMemoryAddresses = properties["numMemoryAddresses"]*1;
	this.registerBitSize = properties["registerBitSize"]*1;
	
	var registerNames = [];
	
	var regLoop = properties["registerNames"].split( "," );
	for ( var regNum in regLoop) {
		registerNames.push( this.trim( regLoop[regNum] ) ); // order is important
	}
	
	this.setRegisterNames(registerNames); // setter does verification
	
	// grab instruction descriptions
	if ( this.trim( lines[lineNum] ) == "[descriptions]" ) {
		lineNum++;
		
		while ( !this.isTitleLine( lines[lineNum]) ) {
		// up until next [ ] heading
		
			this.addLineToDict( descriptions, lines[lineNum] );
		
			lineNum++;
		}
		
	} else {
		throw "Descriptions must be listed before instructions.";
	}
	
	var code;
	if ( this.trim( lines[lineNum] ) == "[instructions]" ) {
		lineNum++;
		
		// code = all following lines without newlines
		// remove all text before start of instructions
		code = lines.slice( lineNum, lines.length ).join();
		code = this.removeWhitespace( code );
	} else {
		throw "No Instruction Set Defined";
	}
	
	// splits each instruction definition
	var instructionCodes = code.split( "." );
	for ( var instructionCode in instructionCodes ) {
		if ( instructionCodes[instructionCode] != "" ) {
			this.addInstructionCode( instructionCodes[instructionCode], descriptions );
		}
	}   
}

/*package emulator.interpreter;

import emulator.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import util.Strings;

public class InterpretedProcessor extends FetchIncExecProcessor {    
        
    public InterpretedProcessor( String definition ) throws InterpreterError {
        super();
        
        updateDefinition( definition );
    }
    
    private String removeWhitespace( String code ) {
        // replace one or more whitespace chars with a nothing
        return code.replaceAll( "\\s+", "" );
    }
    
    private String trim( String str ) {
        return str.replaceAll( "^\\s+", "" ).replaceAll( "\\s+$", "" );
    }
    
    private Boolean isTitleLine( String line ) {
        return ( !trim( line ).equals( "" ) && trim( line ).charAt( 0 ) == '[');
    }
    
    private void addLineToDict( HashMap<String,String> dict, String line ) {
        //trace( " InterpretedProcessor.addLineToDict" );
        //trace( "  trimmed line: " + trim( line ) );
        if ( !trim( line ).equals( "" ) ) {
            
            ArrayList<String> property = new ArrayList<String>( Arrays.asList( line.split( ":" ) ) );
            String key = trim( property.get(0) );
            
            property = new ArrayList<String>( property.subList( 1, property.size() ) );
            String value = trim( Strings.join( property, ":" ) ); // TODO
            
            //trace( "  key: " + key + ", value: " + value );

            dict.put(key, value);
        }
    }
    
    private Boolean isDigit( char c ) {
        return ( c >= '0' && c <= '9' );
    }
    
    private ArrayList<Integer> extractHeader( String code ) {
        ArrayList<Integer> header = new ArrayList<Integer>();
        int i;
        int start, end;

        i = 0;
        start = i;
        while ( i != code.length( ) && code.charAt( i ) != Interpreter.instructionPartSeparator ) {
            i++;
        }
        
        end = i;
        header.add( Integer.parseInt( code.substring( start, end ) ) );
        
        i++; // skip separator char
        start = i;
        while ( i != code.length() && isDigit( code.charAt( i ) ) ) {
            i++;
        }
        
        end = i;
        header.add( Integer.parseInt( code.substring( start, end ) ) );
        
        return header;
    }
    
    private String extractCodeSection( String code ) {
        int codeStart;
        for ( codeStart = 0; codeStart != code.length(); codeStart++ ) {
            // or detect case statement
            if ( code.charAt( codeStart ) == Interpreter.conditionTerminator
                || code.substring( codeStart, codeStart + Interpreter.guardKeyword.length() ).equals( Interpreter.guardKeyword ) ) {
                break;
            }
        }
        return code.substring( codeStart, code.length() );
    }
    
    
    private void addInstructionCode( String code, HashMap<String, String> descriptions ) throws InterpreterError {
        String instrNumStr;
        Integer instrNum;
        int ipInc;
        String instrCode;
        
        ArrayList<Integer> headerParts = extractHeader( code );
        instrNum = headerParts.get(0);
        instrNumStr = instrNum.toString();
        ipInc = headerParts.get(1);
        
        instrCode = extractCodeSection( code );
        
        //trace( "[InterpretedProcessor.addInstructionCode] code: " + code );
        //trace( "[InterpretedProcessor.addInstructionCode] instrNumStr: " + instrNumStr );
        //trace( "[InterpretedProcessor.addInstructionCode] ipInc: " + ipInc );
        //trace( "[InterpretedProcessor.addInstructionCode] instrCode: " + instrCode );
        
        // because java won't let you set past the end of an arraylist
        while (this.instructions.size() <= instrNum) {
        	this.instructions.add(null);
        }
        this.instructions.set(instrNum, new InterpretedInstruction( descriptions.get(instrNumStr), ipInc, instrCode ));
    }
    
    public void updateDefinition( String definition ) throws InterpreterError {
        
        HashMap<String,String> properties = new HashMap<String,String>( );
        HashMap<String,String> descriptions = new HashMap<String,String>( );
        
        this.instructions = new ArrayList<IMicroInstruction>( );
        
        ArrayList<String> lines =  new ArrayList<String>( Arrays.asList( definition.split( "\n" ) ) );
        int lineNum = 0;
        
        while ( !isTitleLine( lines.get(lineNum) ) ) {
            // up until next [ ] heading
            
            addLineToDict( properties, lines.get(lineNum) );
            
            lineNum++;
        }
        // {{ lines[lineNum] starts with '[' }}
        
        this.name = properties.get("name");
        this.memoryBitSize = Integer.parseInt( properties.get("memoryBitSize") );
        this.numMemoryAddresses = Integer.parseInt( properties.get("numMemoryAddresses") );
        this.registerBitSize = Integer.parseInt( properties.get("registerBitSize") );
        
        ArrayList<String> registerNames = new ArrayList<String>( );
        
        for ( String regName : properties.get("registerNames").split( "," ) ) {
            registerNames.add( trim( regName ) ); // order is important
        }
        
        this.setRegisterNames(registerNames); // setter does verification
        
        // grab instruction descriptions
        if ( trim( lines.get(lineNum) ).equals( "[descriptions]" ) ) {
            lineNum++;
            
            while ( !isTitleLine( lines.get(lineNum) ) ) {
            // up until next [ ] heading
            
                addLineToDict( descriptions, lines.get(lineNum) );
            
                lineNum++;
            }
            
        } else {
            throw new InterpreterError( "Descriptions must be listed before instructions." );
        }
        
        String code;
        if ( trim( lines.get(lineNum) ).equals( "[instructions]" ) ) {
            lineNum++;
            
            // code = all following lines without newlines
            // remove all text before start of instructions
            code = Strings.join(lines.subList( lineNum, lines.size( ) ), "");
            code = removeWhitespace( code );
        } else {
            throw new InterpreterError( "No Instruction Set Defined" );
        }
        
        // splits each instruction definition
        ArrayList<String> instructionCodes = new ArrayList<String>( Arrays.asList( code.split( "\\." ) ) );
        for ( String instructionCode : instructionCodes ) {
            if ( instructionCode != "" ) {
                addInstructionCode( instructionCode, descriptions );
            }
        }   
    }
}
*/