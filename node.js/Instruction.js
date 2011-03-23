function Instruction ( description, ipIncrement ) {
	this.description = description;
	this.ipIncrement = ipIncrement;
}

Instruction.prototype.execute = function ( state ) {
	
}

Instruction.prototype.getDescription = function () {
	return this.description;
}

Instruction.prototype.getBytes = function () {
	return this.ipIncrement;
}

/*package emulator;

public class Instruction implements IMicroInstruction {
    
    public String description;
    public int ipIncrement;
    
    public Instruction( String description, int ipIncrement ) {
        this.description = description;
        this.ipIncrement = ipIncrement;
    }
    
    public void execute( State state ) {
        
    }

	public String getDescription() {
		return description;
	}

	public int getBytes() {
		return ipIncrement;
	}

}*/
