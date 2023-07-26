export interface Env {
	PAT: string;
}

export interface ResponseJson {
		message: string;
		merge_type: string;
		base_branch: string;

}

async function syncer(repository: string, token: string) {
	const baseUrl = 'https://api.github.com/repos/rds-staging';
	const response = await fetch(`${baseUrl}/${repository}/merge-upstream`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			accept: 'application/vnd.github+json',
			'User-Agent': 'request',
		},
		body: JSON.stringify({ branch: 'develop' }),
	});
	const responseJson:ResponseJson = await response.json();
	if (!response.ok) {
		throw new Error('Oops the sync failed');
	}
	if(responseJson.merge_type==="none") {
		return({repository:`https://github.com/RdS-Staging/${repository}`,mapped_to:`https://github.com/Real-Dev-Squad/${repository}`, status:{updated: false}})
	} else {
		return({repository:`https://github.com/RdS-Staging/${repository}`,mapped_to:`https://github.com/Real-Dev-Squad/${repository}`, status:{updated: true}})
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const repos = [
			'website-dashboard',
			'website-my',
			'website-status',
			'members-site',
			'website-www',
			'website-members',
			'website-welcome',
		];
		const syncBranchPromises: Array<Promise<any>> = [];

		try {
			repos.forEach((repo) => {
				syncBranchPromises.push(syncer(repo, env.PAT));
			});

			const response = await Promise.all(syncBranchPromises);

			const jsonData = {
				message: "Synced all repositories",
				merge_status: response
			}

			return new Response(JSON.stringify(jsonData), {
				headers:{
					'Access-Control-Allow-Origin': 'dashboard.realdevsquad.com'
				}
			});
		} catch (err) {
			return new Response(`${err}`);
		}
	},
};
