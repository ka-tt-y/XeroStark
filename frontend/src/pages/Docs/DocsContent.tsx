import React from 'react';
import type { DocSection } from './DocsSidebar';

const SECTION_CONTENT: Record<DocSection, React.ReactNode> = {
    overview: (
        <div className="prose-doc">
            <h2>What is Xerostark?</h2>
            <p>
                Xerostark is a platform for creating, managing, and verifying zero-knowledge proofs
                on <strong>Starknet</strong>. It bridges the gap between writing Circom circuits and
                verifying proofs on-chain, providing a seamless end-to-end workflow.
            </p>
            <h3>Key Concepts</h3>
            <ul>
                <li><strong>Circuits</strong> — Circom programs that define a computation to prove. They specify public and private inputs, and the constraints that must hold.</li>
                <li><strong>Proofs</strong> — Cryptographic evidence that you know inputs satisfying a circuit, without revealing the inputs themselves.</li>
                <li><strong>Verifier Contracts</strong> — Smart contracts deployed on Starknet that can verify proofs on-chain, making verification trustless and permanent.</li>
                <li><strong>Templates</strong> — Pre-built circuits from Circomlib and the community that you can use directly or as starting points.</li>
            </ul>
            <h3>How It Works</h3>
            <p>
                The platform handles the full lifecycle: compile your Circom circuit, generate a
                Groth16 verifier contract, declare and deploy it to Starknet, generate proofs with
                your private inputs, and verify them on-chain. All of this happens through a
                simple web interface with your Starknet wallet.
            </p>
        </div>
    ),

    'getting-started': (
        <div className="prose-doc">
            <h2>Getting Started</h2>
            <h3>Prerequisites</h3>
            <ul>
                <li>A Starknet wallet (Argent or Braavos) installed as a browser extension</li>
                <li>Some Sepolia testnet ETH for gas fees (deployments and proof verification)</li>
            </ul>
            <h3>Step 1 — Connect Your Wallet</h3>
            <p>
                Click <strong>Connect Wallet</strong> in the header. If you have multiple wallets
                installed, you'll be asked to choose one. Make sure you're on the
                <strong> Starknet Sepolia</strong> testnet.
            </p>
            <h3>Step 2 — Choose or Upload a Circuit</h3>
            <p>
                Go to <strong>Templates</strong> and either browse verified circuits from Circomlib
                or upload your own <code>.circom</code> file. You can mark your uploaded circuit
                as public to share it with the community.
            </p>
            <h3>Step 3 — Compile &amp; Deploy</h3>
            <p>
                After uploading, the Server compiles your circuit, generates a Groth16 verifier
                contract, and declares the contract class on Starknet. You'll then confirm a
                <strong> deploy transaction</strong> in your wallet — this deploys the verifier
                contract on-chain.
            </p>
            <h3>Step 4 — Generate a Proof</h3>
            <p>
                Navigate to <strong>Circuits → Generate Proof</strong>. Enter your private and
                public inputs, and the Server will generate a Groth16 proof plus the calldata
                needed for on-chain verification.
            </p>
            <h3>Step 5 — Verify On-Chain</h3>
            <p>
                Confirm the verification transaction in your wallet. The verifier contract checks
                the proof on-chain. Once verified, the proof is permanently recorded on Starknet
                and you can share a public link.
            </p>
        </div>
    ),

    circuits: (
        <div className="prose-doc">
            <h2>Working with Circuits</h2>
            <h3>What is a Circom Circuit?</h3>
            <p>
                A Circom circuit defines a set of constraints over signals (variables). It specifies
                <strong> input signals</strong> (private and public) and <strong>output signals</strong>.
                The circuit enforces that certain mathematical relationships hold between these signals.
            </p>
            <h3>Example: Multiplier Circuit</h3>
            <pre><code>{`pragma circom 2.0.0;

template Multiplier() {
    signal input a;
    signal input b;
    signal output c;
    
    c <== a * b;
}

component main = Multiplier();`}</code></pre>
            <p>
                This circuit proves you know two numbers <code>a</code> and <code>b</code> whose
                product equals the public output <code>c</code>.
            </p>
            <h3>Templates from Circomlib</h3>
            <p>
                Circomlib is the official library of reusable Circom circuits maintained by iden3.
                It includes hash functions (Poseidon, MiMC), signature verification (EdDSA),
                comparators, multiplexers, and more. Browse them under <strong>Templates → Browse Templates</strong>.
            </p>
            <h3>Uploading Custom Circuits</h3>
            <p>
                Upload any <code>.circom</code> file via <strong>Templates → Upload Circuit</strong>.
                The platform will compile it, extract input signals, and generate a verifier contract.
                Mark it as <strong>public</strong> to make it available to other users.
            </p>
        </div>
    ),

    proofs: (
        <div className="prose-doc">
            <h2>Generating &amp; Sharing Proofs</h2>
            <h3>How Proofs Work</h3>
            <p>
                Xerostark uses <strong>Groth16</strong>, a zk-SNARK proving system. When you
                generate a proof, you provide private inputs (witness data) and the system produces
                a compact proof that can be verified without revealing the inputs.
            </p>
            <h3>Generating a Proof</h3>
            <ol>
                <li>Select a deployed circuit from <strong>Circuits</strong></li>
                <li>Fill in the required input signals</li>
                <li>Click <strong>Generate Proof</strong></li>
                <li>The Server computes the witness and generates the Groth16 proof</li>
            </ol>
            <h3>Sharing Proofs</h3>
            <p>
                After verifying a proof on-chain, you can generate a <strong>share link</strong>.
                Anyone with the link can view the proof details, public inputs, verification
                status, and the on-chain transaction — without needing a wallet.
            </p>
        </div>
    ),

    verification: (
        <div className="prose-doc">
            <h2>On-Chain Verification</h2>
            <h3>How It Works</h3>
            <p>
                The verifier contract (generated by <strong>Garaga</strong>) is deployed on Starknet
                Sepolia. When you verify a proof, the contract checks the Groth16 proof against
                the verification key embedded in the contract. If valid, the transaction succeeds.
            </p>
            <h3>The Verification Flow</h3>
            <ol>
                <li>Backend generates the proof calldata (formatted for Starknet)</li>
                <li>You sign a transaction in your wallet calling the verifier contract</li>
                <li>The contract executes the pairing check on-chain</li>
                <li>If valid, the proof is recorded as <strong>verified</strong></li>
            </ol>
            <h3>Why On-Chain?</h3>
            <p>
                On-chain verification makes the proof <strong>permanent, trustless, and publicly
                    auditable</strong>. Anyone can check the transaction on a block explorer (Voyager)
                to confirm the proof was verified by the contract.
            </p>
        </div>
    ),

    api: (
        <div className="prose-doc">
            <h2>API Reference</h2>
            <p>All endpoints are under <code>/api/v1</code>.</p>
            <h3>Circuits</h3>
            <div className="api-endpoint">
                <code>GET /api/v1/circuits/files</code>
                <p>List all available Circomlib templates with descriptions.</p>
            </div>
            <div className="api-endpoint">
                <code>GET /api/v1/circuits/:path</code>
                <p>Get the source code of a specific circuit template.</p>
            </div>
            <div className="api-endpoint">
                <code>GET /api/v1/public/circuits</code>
                <p>List all user-shared public circuits.</p>
            </div>
            <div className="api-endpoint">
                <code>GET /api/v1/templates</code>
                <p>List all GitHub-sourced templates with AI-generated descriptions.</p>
            </div>
            <h3>Setup &amp; Deploy</h3>
            <div className="api-endpoint">
                <code>POST /api/v1/setup</code>
                <p>Upload and compile a Circom circuit. Generates verifier contract and declares it on-chain. Returns class hash for deployment.</p>
            </div>
            <div className="api-endpoint">
                <code>POST /api/v1/register-deployment</code>
                <p>Register a verifier contract deployment after wallet confirmation.</p>
            </div>
            <h3>Proofs</h3>
            <div className="api-endpoint">
                <code>POST /api/v1/prove</code>
                <p>Generate a Groth16 proof for a deployed circuit with the provided inputs.</p>
            </div>
            <div className="api-endpoint">
                <code>POST /api/v1/verify</code>
                <p>Get calldata for on-chain verification of a proof.</p>
            </div>
            <div className="api-endpoint">
                <code>POST /api/v1/register-proof</code>
                <p>Register a verified proof after on-chain verification succeeds.</p>
            </div>
            <h3>Stats &amp; Sharing</h3>
            <div className="api-endpoint">
                <code>GET /api/v1/stats</code>
                <p>Get platform-wide statistics (proofs, circuits, deployments).</p>
            </div>
            <div className="api-endpoint">
                <code>POST /api/v1/proofs/:id/share</code>
                <p>Generate a shareable link for a verified proof.</p>
            </div>
            <div className="api-endpoint">
                <code>GET /api/v1/proofs/shared/:token</code>
                <p>Get proof details by share token (public access).</p>
            </div>
        </div>
    ),

    'whats-next': (
        <div className="prose-doc">
            <h2>What's Next</h2>
            <p>
                Xerostark is actively evolving. Here's a look at what's on the roadmap.
            </p>

            <h3>🟣 Noir Circuit Support</h3>
            <p>
                Full support for <strong>Noir</strong> circuits is coming. You'll be able to write, compile, and verify Noir programs on Starknet alongside Circom — same workflow, different proving system.
            </p>

            <h3>📦 Circuit Marketplace</h3>
            <p>
                A community marketplace where developers can publish, discover, and reuse verified circuit templates — with ratings, descriptions, and one-click deployment.
            </p>

            <h3>🔗 SDK &amp; Programmatic Access</h3>
            <p>
                A TypeScript/JavaScript SDK so developers can integrate Xerostark proof generation and verification into their own dApps programmatically, without using the UI.
            </p>

            <h3>🔐 Recursive Proofs</h3>
            <p>
                Support for proof composition — verify a proof inside another proof. This unlocks more advanced use cases like rollup verification and multi-step private computations.
            </p>

            <h3>🌐 Mainnet Deployment</h3>
            <p>
                Xerostark is currently on <strong>Starknet Sepolia</strong>. Once the platform is battle-tested, we'll deploy to mainnet with production-grade infrastructure.
            </p>
        </div>
    ),
};

interface DocsContentProps {
    active: DocSection;
}

const DocsContent: React.FC<DocsContentProps> = ({ active }) => (
    <div className="flex-1 min-w-0">
        {SECTION_CONTENT[active]}
    </div>
);

export default DocsContent;
