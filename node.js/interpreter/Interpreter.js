function Interpreter ( tokens, state, where ) {
	this.state = state;
	this.tokens = tokens;
	this.where = where;
	
	this.guardKeyword  = "case";
	this.helperKeyword = "where";
	this.pretestKeyword = "whenever";
	this.statementSeparator = ";";
	this.conditionTerminator = ':';
	this.instructionPartSeparator = ',';

	this.acceptedToken = null;
	this.pendingToken = null;

	this.tokenPos = 0;

	this.internalAccessible = false;


	this.getToken( );
}


Interpreter.prototype.getToken = function () {
	if ( this.tokenPos != tokens.length ) {
		this.pendingToken = this.tokens[tokenPos];
		this.tokenPos++;
	} else {
		this.pendingToken = null;
	}
}

Interpreter.prototype.accept = function ( tokenType ) {
	var accepted = false;
	
	if ( this.pendingToken != null && this.pendingToken.type == tokenType ) {
		//trace( "[Interpreter.accept] tokenType: " + tokenType );
		//trace( "[Interpreter.accept] pendingToken: " + pendingToken.toString( ) );
		this.acceptedToken = this.pendingToken;
		this.getToken( );
		accepted = true;
	}
	
	return accepted;    
}

Interpreter.prototype.expect = function ( tokenType ) {
	if ( !this.accept( tokenType ) ) {
		throw "Expected " + Token.typeString( tokenType ) + " but found " + pendingToken.typeToString();
	}
}

Interpreter.prototype.validRegister = function ( registerName ) {
	return (this.state.processor.getRegisterNames( ).indexOf( registerName ) != -1);
}



//
// Recursive Descent:
//

Interpreter.prototype.bitExpression = function () {
	var value = this.addExpression( );
	
	while ( this.accept( Token.OpBitwise ) ) {
		if ( this.acceptedToken.value == "^" ) {
			value ^= this.addExpression( );
		} else if ( this.acceptedToken.value == "&" ) {
			value &= this.addExpression( );
		} else if ( this.acceptedToken.value == "|" ) {
			value |= this.addExpression( );
		} else if ( this.acceptedToken.value == ">>" ) {
			value >>= this.addExpression( );
		} else if ( this.acceptedToken.value == "<<" ) {
			value <<= this.addExpression( );
		} else {
			throw "Unknown bitwise operator: " + acceptedToken.value;
		}
	}
	
	return value;
}

Interpreter.prototype.addExpression = function () {
	var value = this.mulExpression();
	while ( this.accept( Token.OpTerm ) ) {
		if ( this.acceptedToken.value == "+" ) {
			value += this.mulExpression( );
		} else if ( this.acceptedToken.value == "-" ) {
			value -= this.mulExpression( );
		} else {
			throw "Unknown additive operator: " + acceptedToken.value;
		}
	}
	
	return value;
}

Interpreter.prototype.mulExpression = function () {
	var value = this.unaryExpression();
	
	while ( accept( Token.OpFactor ) ) {
		if ( this.acceptedToken.value == "*" ) {
			value *= this.unaryExpression( );
		} else if ( this.acceptedToken.value == "/" ) {
			value /= this.unaryExpression( );
		} else if ( this.acceptedToken.value == "%" ) {
			value %= this.unaryExpression( );
		} else {
			throw "Unknown multiplicative operator: " + acceptedToken.value;
		}
	}
	
	return value;
}

Interpreter.prototype.unaryExpression = function () {
	var isUnary = this.accept( Token.OpUnary );

	var value = this.simpleExpression( );
	
	if ( isUnary ) {
		if ( this.acceptedToken.value == "~" ) {
			value = ~value;
		} else {
			throw "Unknown unary operator: " + acceptedToken.value;
		}
	}
	
	return value;
}

Interpreter.prototype.simpleExpression = function () {
	var value = -1; // todo: is this necessary?
	
	if ( this.accept( Token.GroupOpen ) ) {
		value = this.intExpression();
		this.expect( Token.GroupClose );
	} else if ( this.accept( Token.Integer ) ) {
		value = this.acceptedToken.value*1;
	} else if ( this.accept( Token.Hex ) ) {
		value = parseInt( this.acceptedToken.value, 16 );
	} else if ( this.pendingToken.type == Token.RegisterName || this.pendingToken.type == Token.DerefOpen || this.pendingToken.type == Token.RegRefOpen ) {
		value = this.identifier();
	} else if ( this.pendingToken != null ) {
		throw "Unable to parse expression at: " + pendingToken.value;
	}
	
	return value;
}

Interpreter.prototype.identifier = function () {
	var value = -1; // todo: is this necessary?
	var registerName;
	
	if ( this.accept( Token.RegisterName ) ) {
		registerName = this.acceptedToken.value;
		
		if ( this.validRegister( registerName ) ) {
			value = this.state.getRegister( registerName );
		} else if ( this.where.containsKey( registerName ) ) {
			// lookup a 'where' clause value
			//trace( "WHERE" );
			value = Interpreter.interpretExpression( this.where[registerName], this.state, this.where );
		} else {
			throw "Unknown register or 'where' identifier: " + registerName;
		}
	} else if ( this.accept( Token.DerefOpen ) ) {
		var address = this.intExpression();
		
		this.expect( Token.DerefClose );
		
		value = this.state.getMemory( address );
	} else if ( this.accept( Token.RegRefOpen ) ) {
		var registerNumber = this.intExpression();
		
		this.expect( Token.RegRefClose );
		
		if ( registerNumber < this.state.processor.getNumRegisters() ) {
			registerName = this.state.processor.getRegisterNames()[registerNumber];
			value = this.state.getRegister( registerName );
		} else {
			//trace( "[identifier] Out of bounds register reference" );
		}
	} else if ( this.accept( Token.Internal ) ) {
		if ( this.internalAccessible ) {
			if ( this.acceptedToken.value == "numBellRings" ) {
				value = this.state.numBellRings;
			} else if ( this.acceptedToken.value == "numCycles" ) { 
				value = this.state.executionStep;
			} else {
				throw "Unknown integer internal value";
			}
		} else {
			throw "Internal information inaccessible";
		}
	} else {
		throw "Unrecognised identifier: " + pendingToken.value;
	}
	
	//trace("[identifier] value: " + value.toString() );
	return value;
}

Interpreter.prototype.intExpression = function () {
	return this.bitExpression();
}

Interpreter.prototype.stringComparison = function () {
	var value;
	
	
	if ( this.internalAccessible ) {
		this.expect( Token.Internal );
	
		if ( this.acceptedToken.value != "output" ) {
			throw "Unknown internal string identifier: " + acceptedToken.value;
		} 
	
		this.expect( Token.OpComparison );
	
		if ( this.acceptedToken.value == "==" ) {
			this.expect( Token.StringLiteral );
			
			value = ( this.state.output == acceptedToken.value );
			
		} else if ( this.acceptedToken.value == "!=" ) {
			this.expect( Token.StringLiteral );
			
			value = ( this.state.output != acceptedToken.value );
			
		} else {
			throw "Unknown string comparison operator: " + acceptedToken.value;
		}
	} else {
		throw "Internal information inaccessible.";
	}
	
	return value;
}

Interpreter.prototype.boolExpression = function () {
	var value;
	
	if ( this.accept( Token.BoolLiteral ) ) {
		if ( this.acceptedToken.value == "true" || this.acceptedToken.value == "otherwise" ) {
			value = true;
		} else if ( this.acceptedToken.value == "false" ) {
				value = false;
		} else {
			throw "Unknown boolean literal: " + acceptedToken.value;
		}
	} else if ( this.accept( Token.GroupOpen ) ) {
		
		value = this.condition();
		
		this.expect( Token.GroupClose );
	} else if ( this.pendingToken.type == Token.Internal && this.pendingToken.value == "output") { 
		value = this.stringComparison();
	} else {
		var leftSide = this.intExpression( );
		
		this.expect( Token.OpComparison );
		var operator = this.acceptedToken.value;
		var rightSide = this.intExpression( );
		
		if ( this.operator == ">" ) {
			value = leftSide > rightSide;
		} else if ( this.operator == "<" ) {
			value = leftSide < rightSide;
		} else if ( this.operator == ">=" ) {
			value = leftSide >= rightSide;
		} else if ( this.operator == "<=" ) {
			value = leftSide <= rightSide;
		} else if ( this.operator == "==" ) {
			value = leftSide == rightSide;
		} else if ( operator.equals( "!=" ) ) {
			value = leftSide != rightSide;
		} else {
			throw "Unknown comparison operator: " + operator;
		}
	}
	
	return value;
}

Interpreter.prototype.condition = function ( ) {
	var value = this.boolExpression( );
	
	while ( this.accept( Token.OpLogic ) ) {
		if ( this.acceptedToken.value == "&&" ) {
			value = value && this.boolExpression( );
		} else if ( this.acceptedToken.value == "||" ) {
			value = value || this.boolExpression( );
		} else {
			throw "Unknown boolean operator: " + acceptedToken.value;
		}
	}

	return value;
}


Interpreter.prototype.assignment = function ( oldValue ) {
	var newValue;
	
			
	if ( this.accept( Token.OpAssign ) ) {
		
		var tokenValue = this.acceptedToken.value;
		
		// Recurse
		newValue = this.intExpression();
		
		//trace( "[assignment] newValue: " + newValue );
		
		if ( tokenValue == "+=" ) {
			newValue = oldValue + newValue;
		} else if ( tokenValue == "-=" ){
			newValue = oldValue - newValue;
		} else if ( tokenValue == "=" ) {
			// new value already set
		} else {
			throw "Unknown assignment operator: " + acceptedToken.value;
		}
		
	} else if ( this.accept( Token.OpIncAssign ) ) {
		
		newValue = oldValue;
		
		if ( this.acceptedToken.value == "++" ) {
			newValue++;
		} else if ( this.acceptedToken.value == "--" ) {
			newValue--;
		} else {
			throw "Unknown increment operator: " + acceptedToken.value;
		}
		
	} else {
		throw "Unknown assignment operator: " + pendingToken.value;
	}
	return newValue;
}

Interpreter.prototype.statement = function () {
	var value;
	if ( this.accept( Token.RegisterName ) ) {
		// register name assignment
		
		var registerName = this.acceptedToken.value;
		
		if ( this.validRegister( registerName ) ) {
			// recognised register name
			value = this.assignment( this.state.getRegister( registerName ) );
			this.state.setRegister( registerName, value );
			//trace( "[statement] set register " + registerName + " to " + value.toString() ); // TODO (auto): no "set" in java
		} else {
			throw "Unknown register name: " + registerName;
		}
		
	} else if ( this.accept( Token.DerefOpen ) ) {
		// memory address assignment
		
		var memoryAddress = this.intExpression();
		
		this.expect( Token.DerefClose );
		
		value = this.assignment( this.state.getMemory( memoryAddress ) );
		this.state.setMemory( memoryAddress, value );
		
	} else if ( this.accept( Token.RegRefOpen ) ) {
		// register reference assignment
		
		var registerNumber = this.intExpression();
		
		this.expect( Token.RegRefClose );
		
		
		if ( registerNumber < this.state.processor.getNumRegisters( ) ) {
			var registerName = this.state.processor.getRegisterNames( ).get( registerNumber );
			value = this.assignment( this.state.getRegister( registerName ) );
			this.state.setRegister( registerName, value );
		} else {
			//trace( "[statement] Out of bounds register reference" );
		}
		
	} else if ( this.accept( Token.Keyword ) ) {
		// command keyword
		
		var argumentValue;

			if ( this.acceptedToken.value == "print" ) {
				this.expect( Token.GroupOpen );
				this.argumentValue = this.intExpression();
				this.expect( Token.GroupClose );
				
				this.state.print( argumentValue );
			} else if ( this.acceptedToken.value == "printASCII" ) {
				// generalise TODO into functionArguments function:
				this.expect( Token.GroupOpen );
				argumentValue = this.intExpression();
				this.expect( Token.GroupClose );
				
				this.state.printASCII( argumentValue );
			} else if ( this.acceptedToken.value == "bell" ) {
				this.state.ringBell();
			} else if ( this.acceptedToken.value == "halt" ) {
				this.state.halt();    
			} else if ( acceptedToken.value.equals( "nop" ) ) {
				// twiddle thumbs    
			} else {
				throw new InterpreterError( "Unknown command: " + acceptedToken.value );
			}
	} else {
		throw "Unable to parse statement, register name, memory address or command not found.";
	}

} 

//
// Interface
//
Interpreter.prototype.interpretStatement = function ( statementTokens, state, where ) {
	var interpreter = new Interpreter( statementTokens, state, where );
	interpreter.statement();
}

Interpreter.prototype.interpretCondition = function ( conditionTokens, state, where  ) {
	var interpreter = new Interpreter( conditionTokens, state, where );
	return interpreter.condition();
}

Interpreter.prototype.interpretExpression = function ( expressionTokens, state, where  ) {
	var interpreter = new Interpreter( expressionTokens, state, where );
	return interpreter.intExpression();
}



/*package emulator.interpreter;

import java.util.ArrayList;
import java.util.HashMap;

import emulator.State;

public class Interpreter {
    public static final String guardKeyword  = "case";
    public static final String helperKeyword = "where";
    public static final String pretestKeyword = "whenever";
    public static final String statementSeparator = ";";
    public static final char conditionTerminator = ':';
    public static final char instructionPartSeparator = ',';
    
    private State state;
    
    private ArrayList<Token> tokens;
    private Token acceptedToken = null;
    private Token pendingToken;
    
    private int tokenPos = 0;
    
    private HashMap<String,ArrayList<Token>> where;
    
    public Boolean internalAccessible = false;
    
    public Interpreter( ArrayList<Token> tokens, State state, HashMap<String,ArrayList<Token>> where ) {
        this.state = state;
        this.tokens = tokens;
        this.where = where;
        getToken( );
    }
    
    private void getToken() {
        if ( tokenPos != tokens.size( ) ) {
            pendingToken = tokens.get( tokenPos );
            tokenPos++;
        } else {
            pendingToken = null;
        }
    }
    
    private Boolean accept( int tokenType ) {
        Boolean accepted = false;
        
        if ( pendingToken != null && pendingToken.type == tokenType ) {
            //trace( "[Interpreter.accept] tokenType: " + tokenType );
            //trace( "[Interpreter.accept] pendingToken: " + pendingToken.toString( ) );
            acceptedToken = pendingToken;
            getToken( );
            accepted = true;
        }
        
        return accepted;    
    }
    
    private void expect( int tokenType ) throws InterpreterError {
        if ( !accept( tokenType ) ) {
            throw new InterpreterError( "Expected " + Token.typeString( tokenType ) + " but found " + pendingToken.typeToString() );
        }
    }
    
    private Boolean validRegister( String registerName ) {
        return (state.processor.getRegisterNames( ).indexOf( registerName ) != -1);
    }
    
    
    
    //
    // Recursive Descent:
    //
    
    private int bitExpression() throws InterpreterError {
        int value = addExpression( );
        
        while ( accept( Token.OpBitwise ) ) {
            if ( acceptedToken.value.equals( "^" ) ) {
                value ^= addExpression( );
            } else if ( acceptedToken.value.equals( "&" ) ) {
                value &= addExpression( );
            } else if ( acceptedToken.value.equals( "|" ) ) {
                value |= addExpression( );
            } else if ( acceptedToken.value.equals( ">>" ) ) {
                value >>= addExpression( );
            } else if ( acceptedToken.value.equals( "<<" ) ) {
                value <<= addExpression( );
            } else {
                throw new InterpreterError( "Unknown bitwise operator: " + acceptedToken.value );
            }
        }
        
        return value;
    }
    
    private int addExpression() throws InterpreterError {
        int value = mulExpression();
        while ( accept( Token.OpTerm ) ) {
        	if ( acceptedToken.value.equals( "+" ) ) {
                value += mulExpression( );
        	} else if ( acceptedToken.value.equals( "-" ) ) {
                value -= mulExpression( );
        	} else {
                throw new InterpreterError( "Unknown additive operator: " + acceptedToken.value );
            }
        }
        
        return value;
    }
    
    private int mulExpression() throws InterpreterError {
        int value = unaryExpression();
        
        while ( accept( Token.OpFactor ) ) {
        	if ( acceptedToken.value.equals( "*" ) ) {
                value *= unaryExpression( );
        	} else if ( acceptedToken.value.equals( "/" ) ) {
                value /= unaryExpression( );
        	} else if ( acceptedToken.value.equals( "%" ) ) {
                value %= unaryExpression( );
        	} else {
                throw new InterpreterError( "Unknown multiplicative operator: " + acceptedToken.value );
            }
        }
        
        return value;
    }
    
    private int unaryExpression() throws InterpreterError {
        Boolean isUnary = accept( Token.OpUnary );

        int value = simpleExpression( );
        
        if ( isUnary ) {
        	if ( acceptedToken.value.equals( "~" ) ) {
                value = ~value;
        	} else {
                throw new InterpreterError( "Unknown unary operator: " + acceptedToken.value );
            }
        }
        
        return value;
    }
    
    private int simpleExpression() throws InterpreterError {
        int value = -1; // todo: is this necessary?
        
        if ( accept( Token.GroupOpen ) ) {
            value = intExpression();
            expect( Token.GroupClose );
        } else if ( accept( Token.Integer ) ) {
            value = Integer.parseInt( acceptedToken.value );
        } else if ( accept( Token.Hex ) ) {
            value = Integer.parseInt( acceptedToken.value, 16 );
        } else if ( pendingToken.type == Token.RegisterName || pendingToken.type == Token.DerefOpen || pendingToken.type == Token.RegRefOpen ) {
            value = identifier();
        } else if ( pendingToken != null ) {
            throw new InterpreterError( "Unable to parse expression at: " + pendingToken.value );
        }
        
        return value;
    }
    
    private int identifier() throws InterpreterError {
        int value = -1; // todo: is this necessary?
        String registerName;
        
        if ( accept( Token.RegisterName ) ) {
            registerName = acceptedToken.value;
            
            if ( validRegister( registerName ) ) {
                value = state.getRegister( registerName );
            } else if ( where.containsKey( registerName ) ) {
                // lookup a 'where' clause value
                //trace( "WHERE" );
                value = Interpreter.interpretExpression( where.get(registerName), state, where );
            } else {
                throw new InterpreterError( "Unknown register or 'where' identifier: " + registerName );
            }
        } else if ( accept( Token.DerefOpen ) ) {
            int address = intExpression();
            
            expect( Token.DerefClose );
            
            value = state.getMemory( address );
        } else if ( accept( Token.RegRefOpen ) ) {
            int registerNumber = intExpression();
            
            expect( Token.RegRefClose );
            
            if ( registerNumber < state.processor.getNumRegisters() ) {
                registerName = state.processor.getRegisterNames().get(registerNumber);
                value = state.getRegister( registerName );
            } else {
                //trace( "[identifier] Out of bounds register reference" );
            }
        } else if ( accept( Token.Internal ) ) {
            if ( internalAccessible ) {
                if ( acceptedToken.value.equals("numBellRings") ) {
                    value = state.numBellRings;
                } else if ( acceptedToken.value.equals( "numCycles" ) ) { 
                    value = state.executionStep;
                } else {
                    throw new InterpreterError( "Unknown integer internal value" );
                }
            } else {
                throw new InterpreterError( "Internal information inaccessible" );
            }
        } else {
            throw new InterpreterError( "Unrecognised identifier: " + pendingToken.value );
        }
        
        //trace("[identifier] value: " + value.toString() );
        return value;
    }
    
    private int intExpression() throws InterpreterError {
        return bitExpression();
    }
    
    private Boolean stringComparison() throws InterpreterError {
        Boolean value;
        
        
        if ( internalAccessible ) {
            expect( Token.Internal );
        
            if ( acceptedToken.value != "output" ) {
                throw new InterpreterError( "Unknown internal string identifier: " + acceptedToken.value );
            } 
        
            expect( Token.OpComparison );
        
            if ( acceptedToken.value.equals( "==" ) ) {
                expect( Token.StringLiteral );
                
                value = state.output.equals( acceptedToken.value );
                
            } else if ( acceptedToken.value.equals( "!=" ) ) {
                expect( Token.StringLiteral );
                
                value = !state.output.equals( acceptedToken.value );
                
            } else {
                throw new InterpreterError( "Unknown string comparison operator: " + acceptedToken.value );
            }
        } else {
            throw new InterpreterError( "Internal information inaccessible." );
        }
        
        return value;
    }

    private Boolean boolExpression() throws InterpreterError {
        Boolean value;
        
        if ( accept( Token.BoolLiteral ) ) {
            if ( acceptedToken.value.equals( "true" ) || acceptedToken.value.equals( "otherwise" ) ) {
                value = true;
            } else if ( acceptedToken.value.equals( "false" ) ) {
                    value = false;
            } else {
                throw new InterpreterError( "Unknown boolean literal: " + acceptedToken.value );
            }
        } else if ( accept( Token.GroupOpen ) ) {
            
            value = condition();
            
            expect( Token.GroupClose );
        } else if ( pendingToken.type == Token.Internal && pendingToken.value.equals("output")) { 
            value = stringComparison();
        } else {
            int leftSide = intExpression( );
            
            expect( Token.OpComparison );
            String operator = acceptedToken.value;
            int rightSide = intExpression( );
            
            if ( operator.equals( ">" ) ) {
            	value = leftSide > rightSide;
            } else if ( operator.equals( "<" ) ) {
            	value = leftSide < rightSide;
            } else if ( operator.equals( ">=" ) ) {
            	value = leftSide >= rightSide;
            } else if ( operator.equals( "<=" ) ) {
            	value = leftSide <= rightSide;
            } else if ( operator.equals( "==" ) ) {
            	value = leftSide == rightSide;
            } else if ( operator.equals( "!=" ) ) {
            	value = leftSide != rightSide;
            } else {
                throw new InterpreterError( "Unknown comparison operator: " + operator );
            }
        }
        
        return value;
    }
    
    private Boolean condition( ) throws InterpreterError {
        Boolean value = boolExpression( );
        
        while ( accept( Token.OpLogic ) ) {
            if ( acceptedToken.value.equals( "&&" ) ) {
                value = value && boolExpression( );
            } else if ( acceptedToken.value.equals( "||" ) ) {
                value = value || boolExpression( );
            } else {
                throw new InterpreterError( "Unknown boolean operator: " + acceptedToken.value );
            }
        }

        return value;
    }
    
    
    private int assignment( int oldValue ) throws InterpreterError {
        int newValue;
        
                
        if ( accept( Token.OpAssign ) ) {
            
            String tokenValue = acceptedToken.value;
            
            // Recurse
            newValue = intExpression();
            
            //trace( "[assignment] newValue: " + newValue );
            
            if ( tokenValue.equals("+=") ) {
                newValue = oldValue + newValue;
            } else if ( tokenValue.equals( "-=" ) ){
                newValue = oldValue - newValue;
            } else if ( tokenValue.equals( "=" ) ) {
             	// new value already set
            } else {
                throw new InterpreterError( "Unknown assignment operator: " + acceptedToken.value );
            }
            
        } else if ( accept( Token.OpIncAssign ) ) {
            
            newValue = oldValue;
            
            if ( acceptedToken.value.equals("++") ) {
                newValue++;
            } else if ( acceptedToken.value.equals("--") ) {
                newValue--;
            } else {
                throw new InterpreterError( "Unknown increment operator: " + acceptedToken.value );
            }
            
        } else {
            throw new InterpreterError( "Unknown assignment operator: " + pendingToken.value );
        }
        return newValue;
    }
    
    private void statement() throws InterpreterError {
        int value;
        if ( accept( Token.RegisterName ) ) {
            // register name assignment
            
            String registerName = acceptedToken.value;
            
            if ( validRegister( registerName ) ) {
                // recognised register name
                value = assignment( state.getRegister( registerName ) );
                state.setRegister( registerName, value );
                //trace( "[statement] set register " + registerName + " to " + value.toString() ); // TODO (auto): no "set" in java
            } else {
                throw new InterpreterError( "Unknown register name: " + registerName );
            }
            
        } else if ( accept( Token.DerefOpen ) ) {
            // memory address assignment
            
            int memoryAddress = intExpression();
            
            expect( Token.DerefClose );
            
            value = assignment( state.getMemory( memoryAddress ) );
            state.setMemory( memoryAddress, value );
            
        } else if ( accept( Token.RegRefOpen ) ) {
            // register reference assignment
            
            int registerNumber = intExpression();
            
            expect( Token.RegRefClose );
            
            
            if ( registerNumber < state.processor.getNumRegisters( ) ) {
                String registerName = state.processor.getRegisterNames( ).get( registerNumber );
                value = assignment( state.getRegister( registerName ) );
                state.setRegister( registerName, value );
            } else {
                //trace( "[statement] Out of bounds register reference" );
            }
            
        } else if ( accept( Token.Keyword ) ) {
            // command keyword
            
            int argumentValue;

                if ( acceptedToken.value.equals( "print" ) ) {
                    expect( Token.GroupOpen );
                    argumentValue = intExpression();
                    expect( Token.GroupClose );
                    
                    state.print( argumentValue );
                } else if ( acceptedToken.value.equals( "printASCII" ) ) {
                    // generalise TODO into functionArguments function:
                    expect( Token.GroupOpen );
                    argumentValue = intExpression();
                    expect( Token.GroupClose );
                    
                    state.printASCII( argumentValue );
                } else if ( acceptedToken.value.equals( "bell" ) ) {
                    state.ringBell();
                } else if ( acceptedToken.value.equals( "halt" ) ) {
                    state.halt();    
                } else if ( acceptedToken.value.equals( "nop" ) ) {
                    // twiddle thumbs    
                } else {
                    throw new InterpreterError( "Unknown command: " + acceptedToken.value );
                }
        } else {
            throw new InterpreterError( "Unable to parse statement, register name, memory address or command not found." );
        }

    } 
    
    //
    // Interface
    //
    static public void interpretStatement( ArrayList<Token> statementTokens, State state, HashMap<String,ArrayList<Token>> where ) throws InterpreterError {
        Interpreter interpreter = new Interpreter( statementTokens, state, where );
        interpreter.statement();
    }
    
    static public Boolean interpretCondition( ArrayList<Token> conditionTokens, State state, HashMap<String,ArrayList<Token>> where  ) throws InterpreterError {
        Interpreter interpreter = new Interpreter( conditionTokens, state, where );
        return interpreter.condition();
    }
    
    static public int interpretExpression( ArrayList<Token> expressionTokens, State state, HashMap<String,ArrayList<Token>> where  ) throws InterpreterError {
        Interpreter interpreter = new Interpreter( expressionTokens, state, where );
        return interpreter.intExpression();
    }

}
*/