// 	'64YjVg24ekJq7fqofsb8hjipbVBdfsx5TiVqcGLnERTqtAvoKZvWDbjFsTRq7evX7pcvYrHGvJzJGh98zNLEZA6d',
// 	'3nfRxPdEMihVrJzW6bA7jYxxTSCUbXoHJ7UxoV7xKsT2Q39eLrViYj5UPxjW817gfCRhnWwZdPNaZietANj5aErN',
// 	'4yrwrbm1vhJdyaeNX64eFF6M63LUTL9vwba4jAv9mNX6Hzk7D96Tpp3irZb3QszwvQ3bJvFYis77Ec2cEtUDQ8nb',
// 	'4WPTzU3Zjui1oaaKUjPTDFcNyjV95N3bfreUVa3RLWaKMfpdpGtHfBuEnTfrhB92H9rU6yynZoLsU94E2wZY1FLk',
// 	'3icCZAKHmhrYx2L2dofzDNbnoMXd19tNoq78P4SSj6q9xk7NP9Gg5kdC7RnZJiqkE51GMQYjYns7qqjNdWRspLpA',
// 	'2ZuHJgKzZwkpmejERsxosdP3t8XyifdHNAPKup2q4yAL4zxQXjfjpXGUKTeY9g9ViW7rgDDW5NZXa9nNbyc64GFY',
// 	'aCcdMBRwBLUxoeG3ZtSQDwEP1He3mDmdkk5BHihnwhZWurPRSLzGaf77zrsydZJfjGTuHVSixFYRSXsiTCV6BHH'

// trick keypom so near-api-js isn't using window and browser key store
process.versions.node = 'foo';

import { initKeypom, claim, getDropInformation, parseNearAmount } from 'keypom-js';
import { NFTStorage, File } from 'nft.storage'

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

const REQUIRED_DEPOSIT = parseNearAmount('0.1')

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {

		const { searchParams } = new URL(request.url)
		const secretKey = searchParams.get('secretKey');

		await initKeypom({
			network: 'testnet',
		})

		let dropInfo = null
		try {
			dropInfo = await getDropInformation({
				secretKey: secretKey!,
			})
		} catch (e) {
			return new Response(JSON.stringify({ error: 'invalid drop' }));
		}

		const enough = dropInfo!.deposit_per_use === REQUIRED_DEPOSIT
		if (!enough) {
			return new Response(JSON.stringify({ error: 'drop too small' }));
		}

		let claimed = false
		try {
			const response = await claim({
				secretKey: secretKey!,
				accountId: 'md1.testnet'
			})
			claimed = response[0].status.SuccessValue === ''
		} catch(e) {
			console.warn(e)
		}

		if (!claimed) {
			return new Response(JSON.stringify({ error: 'drop not claimed' }));
		}
		
		const client = new NFTStorage({ token: env.NFT_API_KEY })
		let cid = await client.storeBlob(new Blob(["Hello World!"]))
		return new Response(JSON.stringify(`https://ipfs.io/ipfs/${cid}`));

	},
};
