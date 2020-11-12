
// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();




var teams = ["team1", "team2", "team3", "team4", "team5"]

function makeRoundRobinPairings(players) {
  if (players.length % 2 == 1) {
    players.push(null);
  }

  const playerCount = players.length;
  const rounds = playerCount - 1;
  const half = playerCount / 2;

  const tournamentPairings = [];

  const playerIndexes = players.map((_, i) => i).slice(1);

  for (let round = 0; round < rounds; round++) {
    const roundPairings = [];

    const newPlayerIndexes = [0].concat(playerIndexes);

    const firstHalf = newPlayerIndexes.slice(0, half);
    const secondHalf = newPlayerIndexes.slice(half, playerCount).reverse();

    for (let i = 0; i < firstHalf.length; i++) {
      roundPairings.push({
        team1: players[firstHalf[i]],
        team2: players[secondHalf[i]],
      });
    }

    // rotating the array
    playerIndexes.push(playerIndexes.shift());
    tournamentPairings.push(roundPairings);
  }

  return tournamentPairings;
}


client.on('ready', () => {
  console.log('I am ready!');
});


function startSetup(msg) {	
	const embed = new Discord.MessageEmbed()
	.setColor('#0000ff')
	.setTitle('Tournament setup')
	.setDescription("Welcome to the TDBot setup wizzard!")
	.addField("Part 1:", "Enter the name of your tournament:")

	var tournamentCreationData = {name:"", number_of_teams:0, set_playing:""}

	msg.channel.send(embed).then(message => {
		msg.delete();
		addTournamentName(msg.author.id, message, tournamentCreationData);
	})
}

function addTournamentName(creatorID, setupEmbed, data) {
	var filter = m => {
		return creatorID == m.author.id;
	};

	var collector = setupEmbed.channel.createMessageCollector(filter, { max:1, time: 30000 });



	collector.on('collect', m => {
		data.name = m.content;

		const embed = new Discord.MessageEmbed()
		.setColor('#0000ff')
		.setTitle('Tournament setup')
		.setDescription("Welcome to the TDBot setup wizzard!\n\nYour tournament:\nName: __" + data.name + "__")
		.addField("Part 2:", "Enter the question set you are using for this tournament")

		setupEmbed.edit(embed).then(message => {
			m.delete();
			addTournamentSet(creatorID, message, data);
		})


	})
	collector.on('end', collected => {})
}

function addTournamentSet(creatorID, setupEmbed, data) {
	var filter = m => {
		return creatorID == m.author.id;
	};

	var collector = setupEmbed.channel.createMessageCollector(filter, { max:1, time: 30000 });



	collector.on('collect', m => {
		data.set_playing = m.content;

		const embed = new Discord.MessageEmbed()
		.setColor('#0000ff')
		.setTitle('Tournament setup')
		.setDescription("Welcome to the TDBot setup wizzard!\n\nYour tournament:\nName: __" + data.name + "__\nSet: __" + data.set_playing +"__")
		.addField("Part 3:", "Enter how many teams will be playing your tournament.")

		setupEmbed.edit(embed).then(message => {
			m.delete();
			addTournamentTeams(creatorID, message, data);
		})


	})
	collector.on('end', collected => {})
}

function addTournamentTeams(creatorID, setupEmbed, data) {
	var filter = m => {
		return creatorID == m.author.id;
	};

	var collector = setupEmbed.channel.createMessageCollector(filter, { max:1, time: 30000 });



	collector.on('collect', m => {
		data.number_of_teams = parseInt(m.content);

		const embed = new Discord.MessageEmbed()
		.setColor('#0000ff')
		.setTitle('Tournament setup')
		.setDescription("Welcome to the TDBot setup wizzard!\n\nYour tournament:\nName: __" + data.name + "__\nSet: __" + data.set_playing +"__\nNumber of teams: __" + data.number_of_teams + "__")
		.addField("...", "...")

		setupEmbed.edit(embed).then(message => {
			m.delete();
			createTournament(creatorID, data);
		})


	})
	collector.on('end', collected => {})
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

async function transferOwner(guild, id) {
	var timeWaited = 0;
	while(guild.members.cache.get(id) == null && timeWaited < 300000) {
		await sleep(100);
		timeWaited = timeWaited + 100;
	}
	if(timeWaited < 300000) {
		guild.setOwner(guild.members.cache.get(id)).then(updatedGuild => {
			updatedGuild.leave();
		});
	} else {
		guild.delete().then(g => console.log("Deleted"))
	}

}

async function createTournament(send_to_id, data) {
	client.guilds.create(data.name, 'london').then(guild => {
	  guild.channels.create("Announcements").then(channel => {
	  	channel.createInvite()
	    .then(invite => {
	    	
			  guild.roles.create({data: {name: 'Staff', color: 'GREEN'}});
			  createRooms(send_to_id,invite, guild, data)

			  guild.roles.create({data: {name: 'Tournament Director', color: 'BLUE'},reason: 'Tournament Director added'})
			    .then(role => {
			    	role.setPermissions(['ADMINISTRATOR'])
			    	.then(newRole => {
			    		transferOwner(guild, send_to_id)
			    	});
			    })
			    .catch(error => console.log(error))


	    });
	  });


	});
}

async function createRooms(send_to_id,invite, guild, data) {
	  var teams = []
	  for(var i = 0; i < data.number_of_teams; i++) {
	  	var myI = i;
	  	teams.push("Team " + i)
	  	guild.roles.create({data: {name: 'Team ' + i, color: 'WHITE'}})
	  }

	  await sleep(10000)

	  var pairings_by_round = makeRoundRobinPairings(Object.keys(teams));
	  for(var i = 0; i < pairings_by_round.length; i++) { // rounds

	  	guild.channels.create("Round " + (i+1), {type: 'category'}).then(category => {
	  		var myI = parseInt(category.name.substring(5,category.name.length)) - 1
	  		for(var j = 0; j < pairings_by_round[myI].length; j++) { // team_pairings
	  			if(pairings_by_round[myI][j].team1 == null) {
	  				guild.channels.create("BYE for " + pairings_by_round[myI][j].team2 + " / Room " + (j + 1), {type: 'text'}).then(round => {
	  					round.setParent(category)
	  					guild.roles.fetch().then(roles => {
							var staff = roles.cache.filter(r => r.name == "Staff").first();
							var team2 = roles.cache.filter(r => r.name == "Team " + pairings_by_round[myI][parseInt(round.name.charAt(round.name.length-1)) - 1].team2).first();
	  						
	  						round.updateOverwrite(guild.roles.everyone, {VIEW_CHANNEL: false}).then(round => {
								round.updateOverwrite(staff, {VIEW_CHANNEL: true}).then(round => {
									round.updateOverwrite(team2, {VIEW_CHANNEL: true})
								})
							})
						})
	  				})
	  			} else if(pairings_by_round[myI][j].team2 == null) {
	  				guild.channels.create("BYE for " + pairings_by_round[myI][j].team1 + " / Room " + (j + 1), {type: 'text'}).then(round => {
	  					round.setParent(category)
	  					guild.roles.fetch().then(roles => {
							var staff = roles.cache.filter(r => r.name == "Staff").first();
							var team1 = roles.cache.filter(r => r.name == "Team " + pairings_by_round[myI][parseInt(round.name.charAt(round.name.length-1)) - 1].team1).first();
	  						
	  						round.updateOverwrite(guild.roles.everyone, {VIEW_CHANNEL: false}).then(round => {
								round.updateOverwrite(staff, {VIEW_CHANNEL: true}).then(round => {
									round.updateOverwrite(team1, {VIEW_CHANNEL: true})
								})
							})
						})
	  				})
	  			} else {
	  				guild.channels.create("Room " + (j+1), {type: 'text'}).then(round => {
	  					guild.channels.create(round.name, {type: "voice"}).then(vc => {
	  					round.setParent(category)
	  					vc.setParent(category)
	  					guild.roles.fetch().then(roles => {
							var staff = roles.cache.filter(r => r.name == "Staff").first();
							var team1 = roles.cache.filter(r => r.name == "Team " + pairings_by_round[myI][parseInt(round.name.charAt(round.name.length-1)) - 1].team1).first();
							var team2 = roles.cache.filter(r => r.name == "Team " + pairings_by_round[myI][parseInt(round.name.charAt(round.name.length-1)) - 1].team2).first();


								
							vc.updateOverwrite(guild.roles.everyone, {VIEW_CHANNEL: false}).then(round => {
								vc.updateOverwrite(staff, {VIEW_CHANNEL: true}).then(round => {
									vc.updateOverwrite(team1, {VIEW_CHANNEL: true}).then(round => {
										vc.updateOverwrite(team2, {VIEW_CHANNEL: true})
									})
								})
							})



	  						round.updateOverwrite(guild.roles.everyone, {VIEW_CHANNEL: false}).then(round => {
								round.updateOverwrite(staff, {VIEW_CHANNEL: true}).then(round => {
									round.updateOverwrite(team1, {VIEW_CHANNEL: true}).then(round => {
										round.updateOverwrite(team2, {VIEW_CHANNEL: true})
									})
								})
							})
	  					})


	  				})
	  			})
	  			}
	  		}
	  	})
	  }
	  await sleep(10000)
	  client.users.cache.get(send_to_id).send(invite.url)
}


client.on('message', async msg => {

	if(msg.author.bot) return;

	if(msg.content === "!t setup") {
		startSetup(msg);
	}

	if(msg.content === "leave") {
		client.guilds.cache.forEach(guild => {

			if(guild.ownerID == client.user.id) {
				guild.delete();
				return
			}
			guild.leave()

		});
	}

})

client.login('YOUR_TOKEN');
