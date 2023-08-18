import { MongoClient, WithId, Document, ObjectId} from "mongodb";
import { dbName, engineerCollectionName } from "../../utilities/src/mongodbConnect";
import { TicketDocument } from "../../ticket/src/ticketService";
import { assertIsDefined } from "../../utilities/src/utlities";

const currentVersion = 1;

export interface SupportEngineer extends WithId<Document> {
    engineerNumber: number,
    firstName: string,
    lastName: string,
    active: boolean,
    numAssignedTickets: 0,
    tickets: TicketDocument[];
};

async function getNextEngineerNum(client: MongoClient) : Promise<number> {
	const db = client.db(dbName);
	const col = db.collection<SupportEngineer>(engineerCollectionName);
	let lastEngineerNum = 0
	try {
		const lastEngineer = await col.find({}, {projection: {engineerNumber : 1}}).sort({engineerNumber : -1}).limit(1).toArray()
		if (lastEngineer.length == 1) {
			lastEngineerNum = lastEngineer[0].engineerNumber; 
		}
	}catch (err) {
		console.log(err)
	}

	return ++lastEngineerNum;
}

async function createUniqueEngineer(client: MongoClient, firstName: string, lastName: string, tryNumber: number, error: any) : Promise<number> {
	if (tryNumber > 5) {
		throw error

	} else {
		const db = client.db(dbName)
		const col = db.collection(engineerCollectionName)
		try {
			const newEngineerNum = await getNextEngineerNum(client)
			const newEngineer: SupportEngineer = {
				_id: new ObjectId(),
				engineerNumber: newEngineerNum,
                firstName,
                lastName,
                active: true,
				version: currentVersion,
                numAssignedTickets: 0,
				tickets: []
			};
			const res = await col.insertOne(newEngineer)
			console.log(res)
			return newEngineerNum
		} catch (err) {
			return await createUniqueEngineer(client, firstName, lastName, ++tryNumber, err)
		}
	}
	
}

export async function setUpNewEngineer (client: MongoClient, firstName: string, lastName: string)  {
    
    try {
        const newEngineerNum = await createUniqueEngineer(client, firstName, lastName, 1, null);
        return newEngineerNum;
    } catch (err) {
        console.log();
    }
}

// find the # of tickets assigned to the active engineer with the fewest number of tickets
// find all the engineers that have this number of tickets
// randomly select one of those engineers

const mostAvailableEngAggQuery = [
    {
      '$sort': {
        'numAssignedTickets': 1
      }
    }, {
      '$limit': 1
    }, {
      '$lookup': {
        'from': 'supportEngineers', 
        'localField': 'numAssignedTickets', 
        'foreignField': 'numAssignedTickets', 
        'pipeline': [
          {
            '$project': {
              '_id': 0, 
              'numAssignedTickets': 1, 
              'engineerNumber': 1
            }
          }
        ], 
        'as': 'leastUtilizedEngineers'
      }
    }, {
      '$replaceRoot': {
        'newRoot': {
          '$let': {
            'vars': {
              'selectedEngineer': {
                '$floor': {
                  '$multiply': [
                    {
                      '$rand': {}
                    }, {
                      '$size': '$leastUtilizedEngineers'
                    }
                  ]
                }
              }
            }, 
            'in': {
              '$arrayElemAt': [
                '$leastUtilizedEngineers', '$$selectedEngineer'
              ]
            }
          }
        }
      }
    }
  ];

export async function getMostAvailableEngineer(client: MongoClient) : Promise<number | undefined> {
    const db = client.db(dbName);
	const col = db.collection<SupportEngineer>(engineerCollectionName);
    try {
        const mostAvailEng = await col.aggregate(mostAvailableEngAggQuery).toArray();
        assertIsDefined(mostAvailEng[0].engineerNumber);
        return mostAvailEng[0].engineerNumber;
    } catch (err) {
        console.log(err)
    }
    
}