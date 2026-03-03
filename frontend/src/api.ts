// API functions to interact with the Server server

const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : 'http://localhost:8000/api/v1';

const handleResponse = async (response: Response) => {
    const data = await response.json();
    // If the server returned a JSON error body, throw with the message
    if (!response.ok || data.success === false) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
};

const post = async (endpoint: string, body: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return await handleResponse(response);
}

const postText = async (endpoint: string, text: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: text,
    });
    return await handleResponse(response);
}

const get = async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
    });
    return await handleResponse(response);
}

export const setup = (circuitContent: string, address?: string, isPublic?: boolean, forceRedeploy?: boolean) => {
    const params = new URLSearchParams();
    if (address) params.set('address', address);
    if (isPublic !== undefined) params.set('is_public', String(isPublic));
    if (forceRedeploy) params.set('force_redeploy', 'true');
    const qs = params.toString();
    return postText(qs ? `/setup?${qs}` : '/setup', circuitContent);
};
export const prove = (data: any) => post('/prove', data);

// Step 1: Get calldata for on-chain verification (backend generates calldata, no tx submitted)
export const getVerifyCalldata = (data: {
    circuit_hash: string;
    proof: string;
    public_signals: string;
    created_by?: string;
}) => post('/verify', data);

// Step 2: After user submits tx from their wallet, register the proof in the Server DB
export const registerProof = (data: {
    circuit_hash: string;
    proof: string;
    public_signals: string;
    tx_hash: string;
    created_by?: string;
}) => post('/register-proof', data);

// Kept for backward compatibility — alias to getVerifyCalldata
export const verifyOnChain = getVerifyCalldata;
// returns list of <String, String> pairs representing file paths and their names
export const fetchGitHubRepoContents = () => get('/circuits/files');
// returns content of a specific file given its path. we should show the code in an editor
export const fetchContent = (path: string) => get(`/circuits/${encodeURI(path)}`);

// User-specific endpoints
export const getUserCircuits = (address: string) => get(`/user/circuits?address=${encodeURIComponent(address)}`);
export const getUserProofs = (address: string) => get(`/user/proofs?address=${encodeURIComponent(address)}`);
export const getUserDeployments = (address: string) => get(`/user/deployments?address=${encodeURIComponent(address)}`);

// Public circuits — deployed by users and marked as public (available templates)
export const getPublicCircuits = () => get('/public/circuits');
export const shareProof = (proofId: number) => post(`/proofs/${proofId}/share`, {});
export const getSharedProof = (token: string) => get(`/proofs/shared/${token}`);

// Platform statistics for the home page hero
export const getStats = () => get('/stats');

// Get circuit details by hash
export interface CircuitDetails {
    circuit_hash: string;
    name: string | null;
    description: string | null;
    deployed_address: string | null;
    class_hash: string | null;
    input_signals: string[] | null;
    output_signals: string[] | null;
    input_descriptions: Record<string, string> | null;
    output_descriptions: Record<string, string> | null;
}
export const getCircuitDetails = (circuitHash: string): Promise<CircuitDetails> => 
    get(`/circuit/${encodeURIComponent(circuitHash)}`);

// Register a deployment after the user declares and deploys the verifier contract from their wallet
export const registerDeployment = (data: {
    circuit_hash: string;
    class_hash: string;
    contract_address: string;
    tx_hash?: string;
    deployed_by?: string;
}) => post('/register-deployment', data);