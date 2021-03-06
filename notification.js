{
	'use strict';
	// Parameters
	// ##########################################################################################################################################
	
	
	// shorthands
	let _util = bundle.utility;
	let _delta = bundle.EtherDelta;
	

	
	// initiation
	let initiated = false;
	let allowNotifications = false;
	
	let running = false;
    // user input & data
	let publicAddr = '';
	let runningAddr = '';

	let uniqueTokens = {};
		
	// Functions - initialisation
	// ##########################################################################################################################################
		
	init();
	
    $(document).ready(function() 
	{	
		readyInit();  
    });
	
	function init()
	{	
		notificationPermissions();
		// borrow some ED code for compatibility
        _delta.startEtherDelta(() => 
		{	
			//import of etherdelta config
			if(etherDeltaConfig && etherDeltaConfig.tokens)
			{
				_delta.config.tokens = etherDeltaConfig.tokens;
			}
			else 
			{
				showError('failed to load token data');
				return;
			}
			
			// note all listed tokens
			for(let i = 0; i < _delta.config.tokens.length; i++)
			{
				let token = _delta.config.tokens[i];
				if(token /*&& !tokenBlacklist[token.addr]*/) {
					token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
					token.addr = token.addr.toLowerCase();
					token.unlisted = false;
					_delta.config.tokens[i] = token;
					if(!uniqueTokens[token.addr]) {
						uniqueTokens[token.addr] = token;
					}
				}	
			}
			
			//format MEW tokens like ED tokens
			offlineCustomTokens = offlineCustomTokens.map((x) => { return {"name": escapeHtml(x.symbol),
																		   "addr": x.address.toLowerCase(),
																		   "unlisted": true,
																		   "decimals":x.decimal,
																		  };
																 });
			//filter out custom tokens that have been listed by now
			_delta.config.customTokens = offlineCustomTokens.filter((x) => {return !(uniqueTokens[x.addr]) && true;});
			// note custom tokens
			for(let i = 0; i < _delta.config.customTokens.length; i++)
			{
				let token = _delta.config.customTokens[i];
				if(token /*&& !tokenBlacklist[token.addr]*/ && !uniqueTokens[token.addr]) {
					uniqueTokens[token.addr] = token;
				}
			}
			
			// treat tokens listed as staging as unlisted custom tokens
			if(stagingTokens && stagingTokens.tokens)
			{
				//filter tokens that we already know
				let stageTokens = stagingTokens.tokens.filter((x) => {return !(uniqueTokens[x.addr]) && true;});
				for(let i = 0; i < stageTokens.length; i++)
				{
					let token = stageTokens[i];
					if(token /*&& !tokenBlacklist[token.addr]*/ && !uniqueTokens[token.addr])
					{
						token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
						token.unlisted = true;
						uniqueTokens[token.addr] = token;
						_delta.config.customTokens.push(token);
					}
				}
			}
			if(allShitCoins)
			{
				//filter tokens that we already know
				let shitCoins = allShitCoins.filter((x) => {return !(uniqueTokens[x.addr]) && true;});
				for(let i = 0; i < shitCoins.length; i++)
				{
					let token = shitCoins[i];
					if(token /*&& !tokenBlacklist[token.addr]*/ && !uniqueTokens[token.addr])
					{
						token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
						token.unlisted = true;
						uniqueTokens[token.addr] = token;
						_delta.config.customTokens.push(token);
					}
				}
			}
			
			
			initiated = true;
		});
	}
	
	function readyInit()
	{	
		setAddrImage('0x0000000000000000000000000000000000000000');

		// detect enter & keypresses in input
        $('#address').keypress(function(e) 
		{
            if (e.keyCode == 13) {
                $('#refreshButton').click();
                return false;
            } else {
				hideError();
				return true;
			}
        });
		
		/*$(window).resize(function () { 
			$("#transactionsTable").trigger("applyWidgets"); 
		});
		*/
		
		getStorage();

		
		// url parameter ?addr=0x... /#0x..
		let addr = getParameterByName('addr');
		if(! addr)
		{
			let hash = window.location.hash;  // url parameter /#0x...
			if(hash)
				addr = hash.slice(1);
		}
		if(addr)
		{
			addr = getAddress(addr);
			if(addr)
			{
				publicAddr = addr;
				//autoStart = true;
				// auto start loading
				//myClick();
			}
		} 
		else if(publicAddr) //autoload when remember is active
		{
			//autoStart = true;
			// auto start loading
			//myClick();
		}
		else if(!addr && !publicAddr)
		{
			$('#address').focus();
		}
	}
		

	// Functions - input
	// ##########################################################################################################################################
	

	function disableInput(disable)
	{
		$('#refreshButton').prop('disabled', disable);
       // $("#address").prop("disabled", disable);
		$('#loadingTransactions').addClass('dim');
		$("#loadingTransactions").prop("disabled", disable);
	}
	
	function showLoading(trans)
	{
		if(trans)
		{
			$('#loadingTransactions').addClass('fa-spin');
			$('#loadingTransactions').addClass('dim');
			$('#loadingTransactions').prop('disabled', true);
			$('#loadingTransactions').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
		} 
	}
	
	function buttonLoading(trans)
	{
		if(!publicAddr)
		{			
			hideLoading(trans);
			return;
		}
		if(trans)
		{
			$('#loadingTransactions').removeClass('fa-spin');
			$('#loadingTransactions').removeClass('dim');
			$('#loadingTransactions').prop('disabled', false);
			$('#loadingTransactions').show();
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}

	function hideLoading(trans)
	{
		if(!publicAddr)
		{			
			trans = true;
		}

		if(trans) 
		{
			$('#loadingTransactions').hide();
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}
	
	function myClick()
	{
		if(!initiated)
		{
			//autoStart = true;
			return;
		}
		
		if(!allowNotifications)
		{
			showError("no permission for notifications");
			return;
		}
		
		hideError();
		hideHint();
		//disableInput(true);
		// validate address
		publicAddr = getAddress();

		if(publicAddr)
		{
			window.location.hash = publicAddr;
			if(!running)
				startNotifications();
			else
				emptyCallback();
		}
		else
		{
			console.log('invalid input');
		}
	}

	
	
	function notificationPermissions() 
	{
	  // Let's check if the browser supports notifications
	  if (!("Notification" in window)) {
		alert("This browser does not support system notifications");
		allowNotifications = false;
	  }

	  // Let's check whether notification permissions have already been granted
	  else if (Notification.permission === "granted") {
		allowNotifications = true;
	  }

	  // Otherwise, we need to ask the user for permission
	  else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (permission) {
		  // If the user accepts, let's create a notification
		  if (permission === "granted") {
			allowNotifications = true;
		  }
		});
  }

  // Finally, if the user has denied notifications and you 
  // want to be respectful there is no need to bother them any more.
}
	
	
	function startNotifications()
	{
		_delta.connectSocket(emptyCallback, updateNotifications);
		
	}
	
	function emptyCallback()
	{
		if(!running)
		{
			$('#status').html('On');
			running = true;
			runningAddr = publicAddr;
			spawnNotification('Notifications will now appear for ' + runningAddr ,'Notifications active');
		} else if(publicAddr !== runningAddr)
		{
			runningAddr = publicAddr;	
			spawnNotification('Notifications changed to ' + runningAddr ,'Notifications new address');
		}
	}
	
	
	function updateNotifications(type, array)
	{
		let addr = publicAddr.toLowerCase();
		
		if(type == 'orders')
		{
			/*
			buys[], sells[]
			
			amount:"3.12129e+21"
			amountFilled:null
			amountGet:"3.12129e+21"
			amountGive:"499999445100000000"
			availableVolume:"3.12129e+21"
			availableVolumeBase:"499999445100000000"
			deleted:true
			ethAvailableVolume:"3121.29"
			ethAvailableVolumeBase:"0.4999994451"
			expires:"4448918"
			id:"4e8f76ba61738264d491b30c98bb30f5864c50abf9abe6705cc1708f1ba97c1f_buy"
			nonce:"4228584102"
			price:"0.00016019"
			r:"0x6f8853d17a19b20966b787767f921305c6fba3069e2f19fe51697a99d7b5c024"
			s:"0x5f795ee2c8783c0ec026ead71f09c9a58783e2e6887ed0750308fdc46b04cd05"
			tokenGet:"0x8f8221afbb33998d8584a2b05749ba73c37a938a"
			tokenGive:"0x0000000000000000000000000000000000000000"
			updated:"2017-10-29T01:45:41.434Z"
			user:"0x65F403f5Ce12908bFa7d8089f54f097e8B686faE"
			v:28
			
			*/
			for(let i = 0; i < array.buys.length; i++)
			{
				if(array.buys[i].user == addr)
				{
					let token = uniqueTokens[array.buys[i].tokenGet];
					let amount = array.buys[i].ethAvailableVolume;
					let price = Number(array.buys[i].price);
					if(!token)
						token = {name:'???'};
					
					if(array.buys[i].deleted)
					{
						let details = "Buy " + amount + " " + token.name +" at " + price + ", filled or cancelled.";
						spawnNotification(details ,'Buy order ' + token.name + ' removed');
		
					} else if(array.buys[i].amountFilled)
					{
						let details = "Bought " + array.buys[i].amountFilled +"/" + amount + " " + token.name +" at "+ price;
						spawnNotification(details ,'Buy order ' + token.name + ' updated');
					}
					else
					{
						let details = "Buy " + amount + " " + token.name +" at " + price;
						spawnNotification(details ,'New buy order ' + token.name);
					}
				}
			}
			for(let i = 0; i < array.sells.length; i++)
			{
				if(array.sells[i].user == addr)
				{
					let token = uniqueTokens[array.sells[i].tokenGet];
					let amount = array.sells[i].ethAvailableVolume;
					let price = Number(array.sells[i].price);
					if(!token)
						token = {name:'???'};
					
					if(array.sells[i].deleted)
					{
						let details = "Sell " + amount + " " + token.name +" at " + price + ", filled or cancelled.";
						spawnNotification(details ,'Sell order ' + token.name + ' removed');
		
					} else if(array.sells[i].amountFilled && array.sells[i].amountFilled != "null")
					{
						let details = "Sold " + array.sells[i].amountFilled +"/" + amount + " " + token.name +" at "+ price;
						spawnNotification(details ,'Sell order ' + token.name + ' updated');
					}
					else
					{
						let details = "Sell " + amount + " " + token.name +" at " + price;
						spawnNotification(details ,'New sell order ' + token.name);
					}
				}
			}
		}
		else if (type == 'trades')
		{
			/*
			amount:"7.2"
			amountBase:"1.2276"
			buyer:"0xce80cd52a1cc7c6666dc65140a86ba57fd7a8ac9"
			date:"2017-10-29T01:31:22.000Z"
			price:"0.1705"
			seller:"0x2491f9681420a4c104574721a72ab5590e25effa"
			side:"buy"
			tokenAddr:"0x8f3470a7388c05ee4e7af3d01d8c722b0ff52374"
			txHash:"0xaff0b6ce4d81f9188c955b37e27083588929d1ca18b6990b32b35ae5c623cdc5"
			*/
			
			for(let i = 0; i < array.length; i++)
			{
				let details = '';
				if(array[i].seller == addr || array[i].buyer == addr)
				{
					let details = '';
					let title = '';
					let tradeType = 'Taker ';
					let token = uniqueTokens[array[i].tokenAddr];
					let amount = array[i].amount;
					let price = Number(array[i].price);
					if(array[i].side == 'buy')
					{
						if(array[i].seller == addr)
						{
							tradeType = 'Maker ';
							details += 'Sold ';
							title += 'sell ';
						} else 
						{
							details += 'Bought ';
							title += 'buy ';
						}
						
					}
					else if(array[i].side == 'sell')
					{
						if(array[i].buyer == addr)
						{
							tradeType = 'Maker ';
							details += 'Bought ';
							title += 'buy ';
						} 
						else 
						{
							details += 'Sold ';
							title += 'sell ';
						}
					}
					
					title += token.name;
					details += amount + " " + token.name + " at " + price + ', total ' + array[i].amountBase + ' ETH';
					//details += '<br> <a href="https://etherscan.io/tx/' + array[i].txHash + '">' + array[i].txHash +'</a>';
					spawnNotification(details, tradeType + title);
					return;
				}
			}
		}
		else if(type == 'funds' )
		{
			/*	amount: "0.018873952"
				balance:"0.018899373659816986"
				date:"2017-10-29T01:26:21.000Z"
				kind:"Deposit"
				tokenAddr:"0x0000000000000000000000000000000000000000"
				txHash:"0x92b17dc40207e2930ba378c108b4c7418207fb4020b6b2dbc438867b66128559"
				user:"0xfdc97f53d44f81f942a362a0031efd423ea307bc"
				*/
			for(let i = 0; i < array.length; i++)
			{
				if(array[i].user == addr)
				{
					let token = uniqueTokens[array[i].tokenAddr];
					if(!token)
						token = {name:'???'};
					let details = array[i].kind + " " + array[i].amount + " " + token.name + ", new balance: " + array[i].balance;
					//details += '<br> <a href="https://etherscan.io/tx/' + array[i].txHash + '">' + array[i].txHash +'</a>';
					spawnNotification(details , array[i].kind + " " + token.name + " completed");
				}
			}
		}
	}
	
	
	function spawnNotification(body, title) {
	  let options = {
		  body: body,
		  icon: 'favicon.ico'
	  }
	  let n = new Notification(title,options);
	  setTimeout(n.close.bind(n), 7000); 
	}
	
	
	// Functions - validation
	// ##########################################################################################################################################
	// check if input address is valid
    function getAddress(addr) 
	{
        let address = '';
        address = addr ? addr : document.getElementById('address').value;
        address = address.trim();
		
		if ( ! _delta.web3.isAddress(address))
		{
			//check if url ending in address
			if(address.indexOf('/0x') !== -1)
			{
				let parts = address.split('/');
				let lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
				if(lastSegment)
					address = lastSegment;
			}
			
			if(! _delta.web3.isAddress(address)) 
			{
				if (address.length == 66 && address.slice(0, 2) === '0x') 
				{
					// transaction hash, go to transaction details
					window.location = window.location.origin + window.location.pathname + '/../tx.html#' + address;
					return;
				} 

				// possible private key, show warning   (private key, or tx without 0x)
				if (address.length == 64 && address.slice(0, 2) !== '0x') 
				{
					if (!addr) // ignore if in url arguments
					{
						showError("You likely entered your private key, NEVER do that again");
						// be nice and try generate the address
						address = _util.generateAddress(address);
					}
				} 
				else if (address.length == 40 && address.slice(0, 2) !== '0x') 
				{
					address = `0x${addr}`;
					
				} 
				else 
				{
					if (!addr) // ignore if in url arguments
					{
					   showError("Invalid address, try again");
					}
					return undefined;
				}
				if(! _delta.web3.isAddress(address))
				{
					if (!addr) // ignore if in url arguments
					{
					   showError("Invalid address, try again");
					}
					return undefined;
				}
			}
		}
		
		document.getElementById('address').value = address;
		document.getElementById('addr').innerHTML = 'Address: <a target="_blank" href="' + _delta.addressLink(address) + '">' + address + '</a>';
		$('#overviewNav').attr("href", "index.html#" + address);
		setAddrImage(address);
		return address;
    }
	
	function setAddrImage(addr)
	{
		let icon = document.getElementById('addrIcon');
		icon.style.backgroundImage = 'url(' + blockies.create({ seed:addr.toLowerCase() ,size: 8,scale: 16}).toDataURL()+')';
	}
	
	
	
	// get parameter from url
	function getParameterByName(name, url) 
	{
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	
	
	
	
	// Functions - output
	// ##########################################################################################################################################
	
	function showHint(text)
	{
		$('#hinttext').html(text);
		$('#hint').show();
	}
	
	function hideHint()
	{
		$('#hint').hide();
	}
	
	function showError(text)
	{
		$('#errortext').html(text);
		$('#error').show();
	}
	
	function hideError()
	{
		$('#error').hide();
	}
	



	// save address for next time
    function setStorage() 
	{
        if (typeof(Storage) !== "undefined")
		{
            if (remember)
			{
                localStorage.setItem("member", 'true');
                if (publicAddr)
                    localStorage.setItem("address", publicAddr);
            } else
			{
                localStorage.removeItem('member');
                localStorage.removeItem('address');
            }
        } 
    }

    function getStorage() 
	{
        if (typeof(Storage) !== "undefined") 
		{
            remember = localStorage.getItem('member') && true;
            if (remember) 
			{
                let addr = localStorage.getItem("address");
				if(addr)
				{
					addr = getAddress(addr);
					if (addr) 
					{
						publicAddr = addr;
						document.getElementById('address').value = addr;
					}
				}
				$('#remember').prop('checked', true);
            }
        } 
    }

	function escapeHtml(text) {
	  var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	  };

		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}

}