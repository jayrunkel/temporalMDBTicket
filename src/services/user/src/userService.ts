// ================================================================
// USER API
// ++ createUser
// ++ getUserId
// ================================================================

import { MongoClient, WithId, Document, ObjectId} from "mongodb";
import { dbName, usersCollectionName } from "../../utilities/src/mongodbConnect";

export interface UserDocument extends WithId<Document> {
	userId: number,
	firstName: string,
	lastName: string,
	title: string
};

async function getNextUserId(client: MongoClient) : Promise<number | undefined> {
	const db = client.db(dbName);
	const col = db.collection<UserDocument>(usersCollectionName)
	let lastUserId = 0

	try {
		const lastUser: UserDocument[] = await col.find({}, {projection: {userId : 1}}).sort({userId : -1}).limit(1).toArray()
		if (lastUser.length == 1) {
			lastUserId = lastUser[0].userId;
		}
		return ++lastUserId;
	} catch (err) {
		console.log(err)
	}
}

async function createUniqueUser(client: MongoClient, first: string, last: string, title: string, tryNumber: number, error: any) : Promise<number | undefined> {
	if (tryNumber > 5) {
		throw error;   // this will throw null since the value of error passed in is null. Not sure this is correct.

	} else {
		const db = client.db(dbName);
		const col = db.collection(usersCollectionName);
		try {
			const newUserId = await getNextUserId(client);
			if (newUserId) {
				const newUserDoc : UserDocument = {
					_id: new ObjectId(),
					firstName: first, 
					lastName: last, 
					title,
					userId: newUserId
				};

				const res = await col.insertOne(newUserDoc);
				console.log(res);
				return newUserId;
			}
		} catch (err) {
			return await createUniqueUser(client, first, last, title, ++tryNumber, err)
		}
	}
	
}

export async function createUser (client: MongoClient, first: string, last: string, title: string): Promise<number | undefined>{
    try {
        const newUserId = await createUniqueUser(client, first, last, title, 1, null);
        return newUserId;
    } catch (err) {
        console.log(err);
    }
}


export  async function getUserId  (client: MongoClient, first: string, last: string) : Promise <number | null>{
    const db = client.db(dbName);
    const col = db.collection<UserDocument>(usersCollectionName);
	let userId: number | null = null;

    try {
        const user: UserDocument | null = await col.findOne({ firstName: first, lastName: last });
        userId = user ? user.userId : null;
    } catch (err) {
        console.log(err);
    }
	
	return userId;
}