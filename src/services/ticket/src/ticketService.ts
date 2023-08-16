// ****************************************************************
// Sprint 1
//
// Description:
//
//Create a microservice for managing technical support tickets. Operations include:
// - creating a ticket
// - changing ticket status from “open”, “pending”, and “closed”
// - Updating ticket description
//
// Tickets must have the following fields:
// - ticket number
// - title
// - description
// - open date
// - close date
// - ticket owner (the person who created the ticket)
//
// ================================================================
// Sprint 2 Description:
// Allow multiple people to work on tickets. Tickets have an owner plus
// multiple other users who can work on the ticket
//
// Implementation Notes:
//  1. Need to add user table
//  2. Need to convert description field into a table with time stamped comments
//
//
// ================================================================
// Sprint 3 Description:
//
// Add the ability to search for and retrieve tickets based upon searches
// for words and phrases in ticket title and comments. Matches in ticket
// title should be weighted over matches in comments and returned first.
// Search should include typeahead completion and fuzzy search.
//
// Implementation Notes:
//
// Add to additional API calls for search
//  1. getSearchCompletions(phrase): returns an array of strings representing the
//     completions of the phrase
//  2. search(phrase, fuzzyDistanct, numTickets): returns an array of tickets objects
//     (all ticket fields) of max length <numTickets> with:
//        - tickets matching in title first returned before tickets matching in comments
//        - includes snippets (highlighting) of ticket text that matched the search
//        - returns fuzzy matches of 1 character distance
//
// ****************************************************************
import { MongoClient, WithId, Document, ObjectId} from "mongodb";
import { dbName, ticketCollectionName } from "../../utilities/src/mongodbConnect";
import { ticketStatusTypes } from "../../../ticket";
//const validTicketStatuses = ["open", "closed", "inProgress"]

/*
const dbName = "techSupport"
const ticketCollectionName = "ticket"
const usersCollectionName = "users"
const currentVersion = 2


// Create a new MongoClient
//const client = new MongoClient(uri);
var client = null

export async function connectToDatabase (uri) {
    client = new MongoClient(uri);
    await client.connect();
    return client;
}

export async function disconnectFromDatabase () {
    await client.close();
}
*/




// ================================================================
// TICKET API
// ++ createTicket
// ++ getTicket
// ++ changeTicketStatus
// ++ addTicketComment
// ++ getTicketComments
//
// New in Sprint 3
// ++ getSearchCompletions
// ++ search
// ================================================================

const currentVersion = 2;

export interface Comment {
	userId: number,
	date: Date,
	comment: string
};

export interface TicketDocument extends WithId<Document> {
		ticketNumber: number,
		ticketOwner: number,
		subject: string,
		version: number,
		status: ticketStatusTypes,
		comments: Comment[];
};

async function getNextTicketNum(client: MongoClient) : Promise<number> {
	const db = client.db(dbName);
	const col = db.collection(ticketCollectionName);
	let lastTicketNum = 0
	try {
		const lastTicket = await col.find({}, {projection: {ticketNumber : 1}}).sort({ticketNumber : -1}).limit(1).toArray()
		if (lastTicket.length == 1) {
			lastTicketNum = lastTicket[0].ticketNumber 
		}
	}catch (err) {
		console.log(err)
	}

	return ++lastTicketNum
}

// This implementation assumes that there is an unique index on ticketNumber
async function createUniqueTicket(client: MongoClient, owner: number , subject: string, description: string, tryNumber: number, error: any) : Promise<number> {
	if (tryNumber > 5) {
		throw error

	} else {
		const db = client.db(dbName)
		const col = db.collection(ticketCollectionName)
		try {
			const newTicketNum = await getNextTicketNum(client)
			const newTicket: TicketDocument = {
				_id: new ObjectId(),
				ticketNumber: newTicketNum,
				ticketOwner: owner,
				subject,
				version: currentVersion,
				status: "unassigned",
				comments: [{
					userId : owner,
					date : new Date(),
					comment: description
				}]
			};
			const res = await col.insertOne(newTicket)
			console.log(res)
			return newTicketNum
		} catch (err) {
			return await createUniqueTicket(client, owner, subject, description, ++tryNumber, err)
		}
	}
	
}

export  async function createTicket (client: MongoClient, owner:number, subject:string, description:string)  {
    
    try {
        const newTicketNum = await createUniqueTicket(client, owner, subject, description, 1, null);
        return newTicketNum;
    } catch (err) {
        console.log();
    }
}



		
/*
async function convertTicketToCurrentVersion(client: MongoClient, ticketNumber: number, userName: string, version: number, additionalStage: object | null = null) {
	const db = client.db(dbName);
	const col = db.collection(ticketCollectionName);

	if (version === undefined || version == 1) {
		try {
			const userId = await getUserId(userName, null)
			let convertVersion1ToVersion2Pipeline = [
				{
					$set: {
						version: currentVersion,
						ticketOwner: userId,
						comments: {
							$concatArrays : [
								[{
									userId: userId,
									date: '$$NOW',
									comment: '$description'
								}],
								{$ifNull : ["$comments", []]}
							]
						}
					}
				},
				{
					$unset: 'description'
				}
			]
			if (additionalStage) {
				convertVersion1ToVersion2Pipeline.push(additionalStage)
			}
			const res = await col.findOneAndUpdate(
				{ticketNumber : ticketNumber}, //query
				convertVersion1ToVersion2Pipeline, // update pipeline
				{returnDocument : "after"} // return the updated document
			)
			return res.value
		} catch (err) {
			console.log(err.stack)
		}
	}
	else {
		return null
	}
}
*/

export  async function getTicket (client: MongoClient, ticketNumber: number) : Promise<TicketDocument | null> {
    const db = client.db(dbName);
    const col = db.collection(ticketCollectionName);
	const res : TicketDocument | null = null;
    try {
        const res = await col.findOne({ ticketNumber });
        //res = (res == null || res.version == currentVersion) ? res : await convertTicketToCurrentVersion(ticketNumber, res.ticketOwner, res.version);
        console.log(res);
    }
    catch (err) {
        console.log(err);
    }
	return res;
}

/*
export  async function changeTicketStatus (ticketNumber, newStatus)  {
    let operationStatus = false;
    let db = client.db(dbName);
    let col = db.collection(ticketCollectionName);

    if (validTicketStatuses.includes(newStatus)) {
        try {
            let res = (newStatus == "closed") ?
                await col.findOneAndUpdate({ ticketNumber: ticketNumber },
                    [{ $set: { status: newStatus, closeDate: "$$NOW" } }],
                    { returnDocument: "after" }) :
                await col.findOneAndUpdate({ ticketNumber: ticketNumber },
                    { $set: { status: newStatus } },
                    { returnDocument: "after" });
            if (res.version === undefined || res.version == 1)
                res = await convertTicketToCurrentVersion(res.ticketNumber, res.ticketOwner, res.version);
            operationStatus = true;
        } catch (err) {
            console.log(err.stack);
        }
    } else {
        console.log("[ERROR] Attempting to change status of ticket: ", ticketNumber, " to and invalid ticket status: ", newStatus);
    }

    return operationStatus;
}
*/

/*
export  async function addTicketComment  (ticketNumber, userId, description)  {
    let operationStatus = false;
    let db = client.db(dbName);
    let col = db.collection(ticketCollectionName);
    try {
      let res = await col.findOneAndUpdate({ ticketNumber: ticketNumber },
																					 [{
																						 $set: {
																							 comments: {
																								 $concatArrays: [
																									 { $ifNull: ["$comments", []] },
																									 [{
																										 userId: userId,
																										 date: "$$NOW",
																										 comment: description
																									 }]
																								 ]
																							 }
																						 }
																					 }],
																					 { returnDocument: "after" });
      if (res.value != null) {
        if (res.value.version === undefined || res.value.version == 1)
          res = await convertTicketToCurrentVersion(res.value.ticketNumber, res.value.ticketOwner, res.value.version);
        operationStatus = true;
      }
    } catch (err) {
        console.log(err.stack);
    }

    return operationStatus;
}
*/

/*
export async function getTicketComments (ticketNumber)  {
    let db = client.db(dbName);
    let col = db.collection(ticketCollectionName);
    try {
        let res = await col.findOne({ ticketNumber: ticketNumber }, { _id: 0, ticketNumber: 1 });
        return res == null ? null : res.comments;
    }
    catch (err) {
        console.log(err.stack);
    }
}
*/
/*
export async function getSearchCompletions(phrase, numCompletions) {
  const autocompletePipeline = [
		{$search: {
			index: 'autocomplete',
			autocomplete: {
				path: 'subject',
				query: phrase
			}
		}}, {$limit: numCompletions}, {$group: {
			_id: '$subject'
		}}]

	let db = client.db(dbName);
  let col = db.collection(ticketCollectionName);
	let res = null
  try {
    let searchRes = await col.aggregate(autocompletePipeline).toArray()
		res = searchRes.map(doc => doc._id)
  }
  catch (err) {
    console.log(err.stack);
  }

	return res
}
*/

/*
// description 
export async function search(phrase, fuzzyDistance, numResults) {
	const searchPipeline = [
		{$search: {
			index: 'default',
			compound: {
				should: [
					{
						text: {
							query: phrase,
							path: [
								'subject'
							],
							score: {
								boost: {
									value: 10
								}
							},
							fuzzy: {
								maxEdits: fuzzyDistance
							}
						}
					},
					{
						text: {
							query: phrase,
							path: [
								'comments.comment'
							],
							score: {
								boost: {
									value: 5
								}
							},
							fuzzy: {
								maxEdits: fuzzyDistance
							}
						}
					},
					{
						text: {
							query: phrase,
							path: [
								'description'
							],
							score: {
								boost: {
									value: 0.5
								}
							},
							fuzzy: {
								maxEdits: fuzzyDistance
							}
						}
					}
				],
				minimumShouldMatch: 1
			},
			highlight: {
				path: [
					'subject',
					'description',
					'comments.comment'
				]
			}
		}}, {$addFields: {
			score: {
				$meta: 'searchScore'
			},
			highlights: {
				$meta: 'searchHighlights'
			}
		}}, {$limit : numResults}]
	
	let db = client.db(dbName);
  let col = db.collection(ticketCollectionName);
	let res = null
  try {
    res = await col.aggregate(searchPipeline).toArray()
  }
  catch (err) {
    console.log(err.stack);
  }

	return res
}
*/

/*
async function test () {
	let connection = await connectToDatabase(uri)

	let nextUserId = await getNextUserId()
	console.log("Next user id: ", nextUserId)

	let newUserTom = await createUser("Tom", "Jones", "Boss")
	console.log("Bosses user id: ", newUserTom)
	let newUserTomId = await getUserId("Tom", "Jones")
	console.log("Validating Boss is in the database. User Id: ", newUserTomId)

	let ticketNum = await createTicket(newUserTomId, "Help?", "Doesn't work")
	console.log("New Ticket Number: ", ticketNum)
	console.log("New Ticket", await getTicket(ticketNum))
	console.log("Another Ticket", await getTicket(7))

	let nonExistingTicket = await getTicket(13902343)
	console.log("Value of non existing ticket: ", nonExistingTicket)

	await changeTicketStatus(5, "closed")
	console.log("Closed Ticket:", await getTicket(5))

	await changeTicketStatus(ticketNum, "working on it")

	await addTicketComment(4, newUserTom, "Made a change to the ticket")
	console.log("Updated Ticket Description:", await getTicket(4))

	await addTicketComment(9934393, newUserTom, "This ticket does not exist")

	console.log("The ticket comments are: ", await getTicketComments(4))

	console.log("The comments for a non-existant ticket are ", await getTicketComments(9934393))
	
	await disconnectFromDatabase()
}

async function miniTest() {
	console.log(client)
	await connectToDatabase(uri)

	let ticketNum = await getNextTicketNum()
	console.log("Create New Ticket: ", ticketNum)

	let userId = await getNextUserId()
	console.log("Create New User: ", userId)
	await disconnectFromDatabase()
}

test()
*/
