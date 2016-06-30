const Connection =(_=>{
	let scriptListener;
	return class{
		static connection(url, listener){
			const script = document.head.appendChild(document.createElement('script'));
			script.src = `http://127.0.0.1:8080/${url}`;
			scriptListener = listener;
			return script;
		}		
		static callback(data){
			if(scriptListener) scriptListener(data);
		}
		static pushed(){
			Connection.connection(
				'', 
				data=>runner.main.listener.processMessage(data)
			);
		}
	};
})();
const AuctionMessageTranslator = class{
	constructor(listener){
		this.listener = listener;
	}
	processMessage(message){
		if(message.includes('close')) this.listener.auctionClosed();
		else if(message.includes('price')){
			const data = message.split(',').slice(1);
			data[0] = parseFloat(data[0]);
			data[1] = parseFloat(data[1]);
			this.listener.currentPrice(...data);
		}
	}
};
const MainWindow = class{
	static get STATUS_BIDDING(){return 'bid';}
	static get STATUS_LOST(){return 'lost';}
	constructor(){
		const frame = document.body.appendChild(document.createElement('div'));
		frame.style.cssText = 'background:#ff0;border:1px solid #000;border-radius:5px';
		this.sniperStatus = frame.appendChild(document.createElement('div'));
		this.sniperStatus.id = 'sniperStatus';
	}
	showStatus(status){
		this.sniperStatus.innerHTML = status;
	}
};
const Main = class{
	constructor(sniperId, itemId){
		this.sniperId = sniperId;
		this.itemId = itemId;
		this.ui = new MainWindow();
		this.listener = new AuctionMessageTranslator(this);
		this.joinAuction(this.itemId);
	}	
	joinAuction(itemId){
		Connection.connection(
			`join/${this.sniperId}/${itemId}`, 
			data=>this.listener.processMessage(data)
		);
	}
	auctionClosed(){
		this.ui.showStatus(MainWindow.STATUS_LOST);
	}
	currentPrice(price, increment, bidder){
		Connection.connection(
			`bid/${this.sniperId}/${price+increment}`,
			data=>this.listener.processMessage(data)
		);
		this.ui.showStatus(`${MainWindow.STATUS_BIDDING}, price:${price}, increment:${increment}, bidder:${bidder}`);
	}
};
const Driver = class{
	constructor(main){
		this.main = main;
	}
	showSniperStatus(statusText){
		return document.getElementById('sniperStatus').innerHTML.includes(statusText);
	}
};
const Runner = class{
	constructor(){
		this.sniper_id = 'hika';
	}
	startBiddingIn(itemId){
		this.main = new Main(this.sniper_id, itemId);
		this.driver = new Driver(this.main);
		this.driver.showSniperStatus(MainWindow.STATUS_JOINING);
	}
	showsSniperIsBidding(){
		return this.driver.showSniperStatus(MainWindow.STATUS_BIDDING);
	}
	showsSniperHasLostAuction(){
		return this.driver.showSniperStatus(MainWindow.STATUS_LOST);
	}
};
let runner;
