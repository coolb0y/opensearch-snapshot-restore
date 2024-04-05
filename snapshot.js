const axios = require('axios');
const { Client } = require('@opensearch-project/opensearch');
const sourceIndex = 'chipsterindex';
const destinationIndex = 'backup_chipsterindex';
const repositoryName = 'my_snapshot_repo';

const openSearchUrl = 'http://localhost:9200';

const dynamicRepositoryPath = './newfolder8';

const host = 'localhost';
const protocol = 'http';
const port = 9200;
const auth = 'admin:admin'; // For testing only. Don't store credentials in code.
let client;
const indexName = 'chipsterindex';
client = new Client({
  node: `${protocol}://${host}:${port}`,
  ssl: {
    rejectUnauthorized: false, // if you're using self-signed certificates with a hostname mismatch.
  },
  auth: {
    username: 'admin',
    password: 'admin',
  },
});
const mapping = {
  properties: {
    title: {
      type: 'text', // Make the "title" field text searchable
    },
    imagetags: {
      type: 'text', // Make the "title" field text searchable
    },
    baseurl: {
      type: 'keyword', // Make the "category" field filterable
    },
    filetype: {
      type: 'keyword', // Make the "category" field filterable
    },
  },
};

async function createRepository() {
  try {
    const response = await axios.put(`${openSearchUrl}/_snapshot/${repositoryName}`, {
      type: 'fs',
      settings: {
        location: dynamicRepositoryPath,
        compress: true  
      }
    });

    console.log('Repository created:', response.data);
  } catch (error) {
    console.error('Error creating repository:', error.response ? error.response.data : error.message);
  }
}

async function createSnapshot() {
  try {
    const response = await axios.put(`${openSearchUrl}/_snapshot/${repositoryName}/snapshot_${sourceIndex}?wait_for_completion=true`, {
      indices: sourceIndex
    });

    console.log('Snapshot created:', response.data);
  } catch (error) {
    console.error('Error creating snapshot:', error.response ? error.response.data : error.message);
  }
}


async function deleteAndCreateIndex() {
  try{
    
    const ifExists = await client.indices.exists({ index: destinationIndex });
    console.log("Checking if Index exists...")
    console.log(ifExists.body,'if exists');
    if (ifExists && ifExists.body) {
      console.log("Index exists trying to delete...");
      await client.indices.delete({ index: destinationIndex });
      console.log("Index deleted successfully");
    }

  //  const response = await client.indices.create({
  //   index: destinationIndex,
  //   body: {
  //     mappings: {
  //       properties: mapping.properties,
  //     },
  //   },
  // });

  }
  catch(error){
    console.log("Failed to create index or update index");
    console.log("Failed to create index or update index Please check if Opensearch is running");
    console.log(error);
    //throw new Error('Failed to create index or update index');
  }
  
 }

  // Uncomment the following line to create or update the index
 

const createIndex = async () => {
    try {
      
  
      const indexExists = await client.indices.exists({ index: destinationIndex });
      console.log(indexExists,'index exists or not line....');
  
      if (indexExists && indexExists.body ) {
        console.log("Index already exists. Updating mapping...");
        await deleteAndCreateIndex();
        console.log("Index updated successfully");
      } else {
        console.log('Creating index...');

        const response = await client.indices.create({
          index: destinationIndex,
          body: {
            mappings: {
              properties: mapping.properties,
            },
          },
        });
  
        console.log(response, 'response index');
        
        const jsonResponse = JSON.stringify(response);
        console.log(jsonResponse);
      }
    } catch (err) {
      console.log(err);
      console.log('Failed to create or update index');
      const jsonError = JSON.stringify(err);
      console.log(jsonError);
      //throw new Error('Failed to create or update index');
    }
  };
  
  async function restoreIndex() {
    try {
      await deleteAndCreateIndex();

      const response = await axios.post(`${openSearchUrl}/_snapshot/${repositoryName}/snapshot_${sourceIndex}/_restore`, {
        indices: sourceIndex,
        ignore_unavailable: true,
        include_global_state: false,              
        include_aliases: false,
        rename_pattern: sourceIndex,
        rename_replacement: destinationIndex,

      });
  
      console.log('Index restore initiated:', response.data);
    } catch (error) {
      console.error('Error restoring index:', error.response ? error.response.data : error.message);
    }
  }
  


async function callFunc(){
 //await createRepository();
 //await createSnapshot();
 await restoreIndex();
}

callFunc();