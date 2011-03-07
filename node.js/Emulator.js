function Emulator ( ) {
	this.delay = 0;
}

Emulator.prototype.canStateExecute = function ( state ) {
	return ( !state.isHalted );
}

Emulator.prototype.step = function ( state ) {

	state.processor.pipeline.get( state.pipelineStep ).run( state );
	state.pipelineStep = ( state.pipelineStep + 1 ) % state.processor.pipeline.size ( );
	
	if ( state.pipelineStep == 0 ) {
		// next pipeline step is the start of the cycle
		// a full step has been completed
		state.executionStep++;    
	}
	
	// stop running when halted
	if ( state.isHalted ) {
		stop( );
	}
}
    
Emulator.prototype.run = function ( state, maxCycles ) {
	if ( this.canStateExecute( state ) ) {
		this.state = state;
		
		repeatCount = (maxCycles * state.processor.pipeline.size());
		for (i = 0; i < repeatCount && canStateExecute( state ); i++ ){
			step( this.state );
		}
	}
}

Emulator.prototype.stop = function ( ) {
	// TODO: recode.
}

/*package emulator;

public class Emulator {
    
    public int delay;
    
    private State state;
    
    public Emulator( ) {
        this.delay = 0;
    }

    private Boolean canStateExecute( State state ) {
        return (!state.isHalted);
    }

    public void step( State state ) {
        
        state.processor.pipeline.get( state.pipelineStep ).run( state );
        state.pipelineStep = (state.pipelineStep + 1) % state.processor.pipeline.size();
        
        if ( state.pipelineStep == 0 ) {
            // next pipeline step is the start of the cycle
            // a full step has been completed
            state.executionStep++;    
        }
        
        // stop running when halted
        if ( state.isHalted ) {
            stop( );
        }
    }
    
    public void run( State state, int maxCycles ) {
    	if ( canStateExecute( state ) ) {
			this.state = state;
			
			int repeatCount = (maxCycles * state.processor.pipeline.size());
			for (int i = 0; i < repeatCount && canStateExecute( state ); i++ ){
				step( this.state );
			}
		}
    }
    
    public void stop( ) {
        // TODO: recode.
    }

}*/