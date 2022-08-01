const core = require("@actions/core");
const http = require("@actions/http-client");
const auth = require("@actions/http-client/lib/auth");

// most @actions toolkit packages have async methods
async function run() {
  try {
    const host = core.getInput("host");
    const organization = core.getInput("organization");
    const workspace = core.getInput("workspace");
    const token = core.getInput("token");

    const url = `https://${host}/api/v2/organizations/${organization}/workspaces/${workspace}?include=outputs`;

    core.info(`Connecting to ${url}`);

    const bearerToken = new auth.BearerCredentialHandler(token);

    const httpClient = new http.HttpClient("terraform-outputs", [bearerToken]);

    const headers = { [http.Headers.ContentType]: "application/vnd.api+json" };

    const res = await httpClient.get(`${url}`, headers);

    const { errors, included } = JSON.parse(await res.readBody());

    if (errors !== undefined) {
      core.setFailed(JSON.stringify(errors));
    }

    let outputs = included.reduce((acc, x) => {
      acc[x.attributes.name] = x.attributes.value;
      return acc;
    }, {});

    core.setOutput("outputs", `'${JSON.stringify(outputs)}'`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
