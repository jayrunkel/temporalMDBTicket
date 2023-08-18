import { getDBClient } from "../../activities";
import { MongoClient } from "mongodb";
import { setUpNewEngineer } from "../../services/tsEngineer/src/engineerService";

async function initialLoadTest() {
    const client: MongoClient = await getDBClient();

    const promises = [
        setUpNewEngineer(client, "Jay", "Runkel"),
        setUpNewEngineer(client, "Tom", "Smith"),
        setUpNewEngineer(client, "Donald", "Trump"),
        setUpNewEngineer(client, "Zach", "Busch"),
        setUpNewEngineer(client, "Taylor", "Swift"),
    ];

    const newEngineerIds = await Promise.all(promises);

    console.log("Engineer loading complete. IDs: ", newEngineerIds)
}

initialLoadTest().then(() => console.log("Test complete.")).catch((err) => {console.log(err)});