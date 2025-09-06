import Link from "next/link";
import { ArrowBigLeft } from "lucide-react";

export default function RockPaperScissors() {
    return (
        <div>
            <div className="content-header flex mb-4">
                <ArrowBigLeft size={20} className="text-primary" />
                <Link href="/" className="ml-2 text-primary text-sm">Back to Home</Link>
            </div>
            <h1>Rock Paper Scissors Game</h1>
            <p>Welcome to the Rock Paper Scissors game!</p>
            <p>Choose your move and see if you can beat the computer!</p>
        </div>
    );
}
