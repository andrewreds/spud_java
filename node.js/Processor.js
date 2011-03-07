function Processor () {
	// mandatory registers
	this.setRegisterNames( ["IP", "IS"] );
}

Processor.prototype.getNumRegisters = function ( ) {
	return this.registerNames.length;
}

Processor.prototype.setRegisterNames = function ( names ) {
	
	this.registerIndexLookup = {};
	
	this.registerNames = names;
	
	var hasIP = false;
	var hasIS = false;

	for ( i = 0; i != names.length; i++ ) {
		var name = names[i];
		this.registerIndexLookup[name] = i;
		
		if ( name == "IP" ) {
			hasIP = true;
		} else if ( name == "IS" ) {
			hasIS = true;
		}
		
	}
	
	if ( !hasIP || !hasIS ) {
		throw new Error("Processor must have IP and IS registers");
	}
}

Processor.prototype.getRegisterNames = function ( ) {
	return this.registerNames;
}

Processor.prototype.getJSON = function ( ) {
	var sb = "";
	sb = sb + "{\n";

	sb = sb + "    \"name\": \"";
	sb = sb + name;
	sb = sb + "\",\n";
	
	sb = sb + "    \"memorysize\": ";
	sb = sb + numMemoryAddresses;
	sb = sb + ",\n";
	
	sb = sb + "    \"registers\": [" ;
	var first = true;
	for ( var registerName in this.registerNames ) {
		if (!first) sb = sb + ",";
		first = false;
		
		sb = sb + "\"";
		sb = sb + this.registerNames[registerName];
		sb = sb + "\"";
	}
	sb = sb + "],\n";
	
	sb = sb + "    \"instructions\": [\n";
	for ( var i = 0; i < this.instructions.length; i++ ) {
		var instruction = this.instructions[i];
		if ( instruction != null ) {
			sb = sb + "        [";
			sb = sb + i;
			sb = sb + ", ";
			sb = sb + instruction.getBytes( );
			sb = sb + ", \"";
			sb = sb + instruction.getDescription( );
			sb = sb + "\"]";
			
			if ( i != instructions.length - 1 ) {
				sb = sb + ",";
			}
			
			sb = sb + "\n";
		}
	}
	sb = sb + "    ]\n";
	sb = sb + "}";
	
	return sb;
}


/*package emulator;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;

import java.util.HashMap; // TODO (auto): no flash imports

public class Processor {
    
    public String name;
    public int memoryBitSize;
    public int registerBitSize;
    public int numMemoryAddresses;
    
    private ArrayList<String> registerNames;
    
    public HashMap<String,Integer> registerIndexLookup;
    
    public int getNumRegisters( ) {
        return registerNames.size();
    }
    
    public void setRegisterNames( ArrayList<String> names ) {
        
        registerIndexLookup = new HashMap<String,Integer>( );
        
        this.registerNames = names;
        
        Boolean hasIP = false;
        Boolean hasIS = false;

        for ( int i = 0; i != names.size(); i++ ) {
            String name = names.get(i);
            registerIndexLookup.put(name, i);
            
            if ( name.equals( "IP" ) ) {
                hasIP = true;
            } else if ( name.equals( "IS" ) ) {
                hasIS = true;
            }
            
        }
        
        if ( !hasIP || !hasIS ) {
            throw new Error("Processor must have IP and IS registers");
        }
    }
    public ArrayList<String> getRegisterNames( ) {
        return this.registerNames;
    }
    
    public ArrayList<IMicroInstruction> instructions;
    public ArrayList<IPipelineStep> pipeline;
    
    public String getJSON( ) {
    	StringBuilder sb = new StringBuilder( );
    	sb.append( "{\n" );

    	sb.append( "    \"name\": \"" );
    	sb.append( name );
    	sb.append( "\",\n" );
    	
    	sb.append( "    \"memorysize\": " );
    	sb.append( numMemoryAddresses );
    	sb.append( ",\n" );
    	
    	Iterator<String> registerIterator = registerNames.iterator( );
    	sb.append( "    \"registers\": [" );
    	while ( registerIterator.hasNext( ) ) {
    		sb.append( "\"" );
    		sb.append( registerIterator.next( ) );
    		sb.append( "\"" );
    		
    		if ( registerIterator.hasNext( ) ) {
    			sb.append( "," );
    		}
    	}
    	sb.append( "],\n" );
    	
    	sb.append( "    \"instructions\": [\n" );
    	for ( int i = 0; i < instructions.size( ); i++ ) {
    		IMicroInstruction instruction = instructions.get( i );
    		if ( instruction != null ) {
    			sb.append( "        [" );
    			sb.append( i );
    			sb.append( ", " );
    			sb.append( instruction.getBytes( ) );
    			sb.append( ", \"" );
    			sb.append( instruction.getDescription( ) );
    			sb.append( "\"]" );
    			
    			if ( i != instructions.size( ) - 1 ) {
    				sb.append( "," );
    			}
        		
        		sb.append( "\n" );
    		}
    	}
    	sb.append( "    ]\n" );
    	sb.append( "}" );
    	
    	return sb.toString( );
    }
    
    public Processor( ) {
        // mandatory registers
        this.setRegisterNames( new ArrayList<String>( Arrays.asList( new String[] {"IP", "IS"} ) ) );
    }

}
*/