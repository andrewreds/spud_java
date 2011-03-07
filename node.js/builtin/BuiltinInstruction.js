function BuiltinInstruction ( description, ipIncrement, instruction) {
	this.description = description;
	this.ipIncrement = ipIncrement;
	this.instruction = instruction;
}

BuiltinInstruction.prototype.execute = function ( state ) {
	this.instruction( state );
}

BuiltinInstruction.prototype.getDescription = function ( ) {
	return this.description;
}

BuiltinInstruction.prototype.getBytes = function ( ) {
	return this.ipIncrement;
}

/*package emulator.builtin;

import emulator.*;

public class BuiltinInstruction implements IMicroInstruction {

    public String description;
    public int ipIncrement;
    private IInstruction instruction;
    
    public BuiltinInstruction( String description, int ipIncrement, IInstruction instruction ) {
        this.description = description;
        this.ipIncrement = ipIncrement;
        this.instruction = instruction;
    }
    
    public void execute( State state ) {
    	instruction.run( state );
    }
    
	public String getDescription( ) {
		return description;
	}
	
	public int getBytes( ) {
		return ipIncrement;
	}
    
}
*/