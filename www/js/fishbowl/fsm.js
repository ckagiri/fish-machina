/*global angular, machina */
'use strict';
var INITIAL_STATE = 'fill';
var fsm = angular.module('fsm', []);
var fsmService = fsm.factory('fsmService', function() {
	var eventHistory = [];
	var writeToDom = function ( eventName, data ) {
		eventHistory.push({eventName: eventName, data: JSON.stringify(data, null, 4)});
	};

	var Jug = machina.Fsm.extend( {
		namespace: 'jug',
		initialState: INITIAL_STATE,
		states: {
			empty: {
				_onEnter: function() {
					this.qty = 0;
					this.emit('newQty', {qty: this.qty});
					this.transition('goalCheck');
				}
			},
			fill: {
				_onEnter: function() {
					this.qty = this.max;
					this.emit('newQty', {qty: this.qty});
					this.transition('goalCheck');
				},
			},
			offer: {
				_onEnter: function() {
					this.handle('makeOffer');
					juggler.emit("offer", this.offer);
				},
				makeOffer: function() {
					this.offer =  
						{
							type: 'offer',
							qty: this.qty,
							from: this.namespace,
						};
					return this.offer;
				},
				handleReceipt: function(offerAppraisal) {
					this.qty = offerAppraisal.refused;
					// UI
					this.emit('newQty', {qty: this.qty});
					this.transition('goalCheck');
				},
			},
			//========== state offerReceive
			offerReceive: {
				_onEnter: function() {
					// Calculate the distribution and save the new qty.
					this.offer = this.handle('processOffer', this.offer);

					// this.emit('offerReceive', this.offer);

					this.transition('goalCheck');
				},
				
				processOffer: function(offer) {
					// Retrieve the water levels.
					var appraisedOffer = this.handle('appraiseOffer', offer);

					// Change the FSM and State's qty.
					this.qty = appraisedOffer.newQty;
					this.offer = appraisedOffer;

					// Then send a receipt of the new status back to sender.
					juggler.emit(appraisedOffer.type, appraisedOffer);

					// UI
					this.emit('newQty', {qty: this.qty});

					return appraisedOffer;
				},

				appraiseOffer: function(offer) {
					// Use calculates the empty space in the jug, and accepts that amount in the qty offer, or a less if the offer is less.
					var accepted =  Math.min(this.max - this.qty, offer.qty);
					
					// The refused amount is what is not accepted of the offer. (And stays in the jug.)
					var refused = offer.qty - accepted;
					
					// Create appraisal
					var appraisal = {
						type: 'appraisal',
						accepted: accepted,
						refused: refused,
						newQty: this.qty + accepted,
					};	
					angular.extend(offer, appraisal); // Mix in 

					return offer;
				},
			},
			
			goalCheck: {
				_onEnter: function() {
					if (this.goal) {
						if (this.qty == this.goal) {
							this.emit('goal', {qty: this.qty, goal: this.goal, goalStatus:true});
						}
					}
				},
			},
		}
	} );

	var jug3 = new Jug({
		namespace: 'jug3',
		max: 3,
		qty: INITIAL_STATE==='fill'?this.max:0,
		clearAll: clearAll
	});

	var jug5 = new Jug({
		namespace: 'jug5',
		max: 5,
		qty: INITIAL_STATE==='fill'?this.max:0,
		goal: 4,
		goalReached: false,
		clearAll: clearAll
	});

	function clearAll() {
		jug3.qty = 0;
		jug3.ws.setQty(jug3.qty);
		jug5.qty = 0;
		jug5.ws.setQty(jug5.qty);
	}

	function forwardOffer (fsm, type, offer, transition, handle) {
		if (offer.type === type) {
			offer.to = fsm.namespace;
			fsm.offer = offer;
			if (transition) {
				fsm.transition(transition);
			}
			if (handle) {
				fsm.handle(handle, offer);
			}
		}
	}

	var juggler = new machina.Fsm( {
		namespace: 'juggler',
		initialState: 'jug3Enabled',
		eventListeners: {
			'*': [ function( eventName,  data) {
					writeToDom(eventName, data);
					switch ( eventName ) {
						case 'offer':
							var sm = data.from == 'jug5' ? jug3 : jug5;
							forwardOffer( sm, 'offer', data,  'offerReceive', '');
							break;
						case 'appraisal':
							var sm = data.from == 'jug5' ? jug5 : jug3;
							forwardOffer( sm, 'appraisal', data, '', 'handleReceipt');
							break;
						default:
							break;
					}
				}
			]
		},
		states: {
			jug3Enabled: {
				// after _onEnter execs, send 'reset' input down the hierarchy
				_onEnter: function() {
					this.emit( 'jug3', { status: 'enabled' } );
				},
				timeout: 'jug5Enabled',
				_child: jug3,
			},
			jug5Enabled: {
				_onEnter: function() {
					this.emit( 'jug5', { status: 'enabled' } );
				},
				timeout: 'jug3Enabled',
				_child: jug5
			}
		}
	} );



	return {
		jug3: jug3,
		jug5: jug5,
		juggler: juggler,
		eventHistory: eventHistory, 
	};


});

