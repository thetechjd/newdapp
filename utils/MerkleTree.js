const { MerkleTree } = require('merkletreejs')
const KECCAK256 = require('keccak256')
const addresses = require('./addresses');




const leaves = addresses.map(x => KECCAK256(x));

const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true })

const buf2hex = x => '0x' + x.toString('hex')






const root = buf2hex(tree.getRoot())


console.log("This is the root: " + root);

const leaf = buf2hex(KECCAK256(addresses[1]));
const proofEx = tree.getProof(leaf).map(x => buf2hex(x.data));


const proof = tree.getProof(leaf);

//console.log(leaf);

//console.log(proof)



const test = new Array();
test.push(proofEx);

//console.log(proofEx);

//console.log(tree.verify(proof, leaf, root))

