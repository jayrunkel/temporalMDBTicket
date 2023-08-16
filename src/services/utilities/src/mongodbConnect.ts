import { MongoClient } from "mongodb";

export const dbName = "techSupport"
export const ticketCollectionName = "ticket"
export const usersCollectionName = "users"
const uri = "http://localhost:27017"


export async function connectToDatabase (): Promise<MongoClient | undefined> {

    let client : MongoClient | undefined = undefined;

    try {
        client = new MongoClient(uri);
        await client.connect();
    } catch (err) {
        console.log(`Error connecting to database (${uri}): ${err}`);
    }
    return client;
}

export async function disconnectFromDatabase (client: MongoClient) {
    await client.close();
}