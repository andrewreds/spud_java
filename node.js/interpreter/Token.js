function Token( type, value ) {
	this.type = type;
	this.value = value;
}

Token.OpAssign        = 0;
Token.OpLogic         = 1;
Token.OpComparison    = 2;
Token.BoolLiteral     = 3;
Token.GroupOpen       = 4;
Token.GroupClose      = 5;
Token.OpTerm          = 6;
Token.OpFactor        = 7;
Token.Integer         = 8;
Token.Keyword         = 9;
Token.RegisterName    = 10;
Token.DerefOpen       = 11;
Token.DerefClose      = 12;
Token.OpIncAssign     = 13;
Token.OpBitwise       = 14;
Token.OpUnary         = 15;
Token.RegRefOpen      = 16;
Token.RegRefClose     = 17;
Token.Hex             = 18;
Token.Internal        = 19;
Token.StringLiteral   = 20;

Token.prototype.typeString = function ( type ) {
	var typeNames = [
		"assignment",
		"logical operator",
		"logical comparison",
		"boolean literal",
		"open group",
		"close group",
		"term operator",
		"factor operator",
		"integer",
		"keyword",
		"register name",
		"open dereference",
		"close dereference",
		"modifying assignment",
		"bitwise operator",
		"unary operator",
		"register reference open",
		"register reference close",
		"hex hash"];
	
	return typeNames[type];
}


Token.prototype.toString = function () {
	return "(" + Token.typeString( this.type ) + ", \"" + this.value + "\")";
}

Token.prototype.typeToString = function () {
	return Token.typeString( this.type );
}


/*package emulator.interpreter;

import java.util.ArrayList;
import java.util.Arrays;

public class Token {
    public static final int OpAssign        = 0;
    public static final int OpLogic         = 1;
    public static final int OpComparison    = 2;
    public static final int BoolLiteral     = 3;
    public static final int GroupOpen       = 4;
    public static final int GroupClose      = 5;
    public static final int OpTerm          = 6;
    public static final int OpFactor        = 7;
    public static final int Integer         = 8;
    public static final int Keyword         = 9;
    public static final int RegisterName    = 10;
    public static final int DerefOpen       = 11;
    public static final int DerefClose      = 12;
    public static final int OpIncAssign     = 13;
    public static final int OpBitwise       = 14;
    public static final int OpUnary         = 15;
    public static final int RegRefOpen      = 16;
    public static final int RegRefClose     = 17;
    public static final int Hex             = 18;
    public static final int Internal        = 19;
    public static final int StringLiteral   = 20;
    
    public static String typeString( int type ) {
        ArrayList<String> typeNames = new ArrayList<String>( Arrays.asList( new String[] {
            "assignment",
            "logical operator",
            "logical comparison",
            "boolean literal",
            "open group",
            "close group",
            "term operator",
            "factor operator",
            "integer",
            "keyword",
            "register name",
            "open dereference",
            "close dereference",
            "modifying assignment",
            "bitwise operator",
            "unary operator",
            "register reference open",
            "register reference close",
            "hex hash"
        } ) );
        
        return typeNames.get( type );
    }
    

    public String value;
    public int type;
    
    public String toString() {
        return "(" + Token.typeString( this.type ) + ", \"" + this.value + "\")";
    }
    
    public String typeToString() {
        return Token.typeString( this.type );
    }
    
    public Token( int type, String value ) {
        this.type = type;
        this.value = value;
    }
    
}
*/