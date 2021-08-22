const { hexy } = require('hexy')
const { connect, keyStores } = require("near-api-js")
const path = require("path")
const homedir = require("os").homedir()

const CREDENTIALS_DIR = ".near-credentials";


const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

const config = {
  keyStore,
  networkId: "mainnet",
  nodeUrl: "https://rpc.mainnet.near.org",
};

export async function getTransactions(startBlock, endBlock, accountId) {
  const near = await connect(config);

  // creates an array of block hashes for given range
  const blockArr = [];
  let blockHash = endBlock;
  do {
    const currentBlock = await getBlockByID(blockHash);
    blockArr.push(currentBlock.header.hash);
    blockHash = currentBlock.header.prev_hash;
    console.log("Reading block", blockHash);
  } while (blockHash !== startBlock);

  // returns block details based on hashes in array
  const blockDetails = await Promise.all(
    blockArr.map((blockId) =>
      near.connection.provider.block({
        blockId,
      })
    )
  );

  // returns an array of chunk hashes from block details
  const chunkHashArr = blockDetails.flatMap((block) =>
    block.chunks.map(({ chunk_hash }) => chunk_hash)
  );

  //returns chunk details based from the array of hashes

  const chunkDetails = await Promise.all(
    chunkHashArr.map((chunk) => {
      return near.connection.provider.chunk(chunk);
    })
  );

  // checks chunk details for transactions
  // if there are transactions in the chunk we
  // find ones associated with passed accountId
  const transactions = chunkDetails.flatMap((chunk) =>
    (chunk.transactions || []).filter((tx) => tx.receiver_id === accountId)
  );

  //creates transaction links from matchingTxs
  const txsLinks = transactions.map((txs) => ({
    method: txs.actions[0].FunctionCall.method_name,
    arguments: decodeFunctionArguments(txs.actions[0].FunctionCall.args),
    link: `https://explorer.near.org/transactions/${txs.hash}`,
  }));
  console.log("MATCHING TRANSACTIONS: ", transactions);
  console.log("TRANSACTION LINKS: ", txsLinks);
}

async function getBlockByID(blockID) {
  const near = await connect(config);
  const blockInfoByHeight = await near.connection.provider.block({
    blockId: blockID,
  });
  return blockInfoByHeight;
}

const decodeFunctionArguments = (args: string) => {
    const decodedArgs = Buffer.from(args, "base64");
    let prettyArgs: string;
    try {
        const parsedJSONArgs = JSON.parse(decodedArgs.toString());
        prettyArgs = JSON.stringify(parsedJSONArgs, null, 2);
    } catch {
        prettyArgs = hexy(decodedArgs, { format: "twos" });
    }
    return JSON.parse(prettyArgs)
}