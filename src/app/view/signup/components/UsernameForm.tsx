import React from 'react';
import TextField from '@mui/material/TextField';
import { ValidationPopup, LoadingSpinner, textFieldSx } from './shared';
import { USERNAME_ALLOWED_CHAR_REGEX, USERNAME_RULE_MESSAGE } from '../useUsernameAvailability';

interface UsernameFormProps {
    username: string;
    setUsername: (val: string) => void;
    isUsernameFocused: boolean;
    setIsUsernameFocused: (val: boolean) => void;
    usernameRequirements: any[];
    hasCapitalLetters: boolean;
    availability: any;
    isUsernameSubmitting: boolean;
    handleUsernameSubmit: (e: React.FormEvent) => void;
    UsernameFeedbackComponent: React.ComponentType<any>; // Passed down to avoid circular deps
}

export const UsernameForm = ({
    username,
    setUsername,
    isUsernameFocused,
    setIsUsernameFocused,
    usernameRequirements,
    hasCapitalLetters,
    availability,
    isUsernameSubmitting,
    handleUsernameSubmit,
    UsernameFeedbackComponent
}: UsernameFormProps) => {
    const hasInvalidUsernameCharacters = !USERNAME_ALLOWED_CHAR_REGEX.test(username)
    const usernameFeedbackStatus = hasInvalidUsernameCharacters ? 'invalid' : (hasCapitalLetters ? 'idle' : availability.status)
    const usernameFeedbackError = hasInvalidUsernameCharacters ? USERNAME_RULE_MESSAGE : availability.error

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2 mb-6 -mt-8">
                <h1 className="text-xl font-bold text-white">Verification Successful!</h1>
                <p className="text-gray-400 text-xs">Last step, Make a Unique Username</p>
            </div>
            <div className="space-y-4">
                <div className="relative">
                    <TextField
                        id="username-final"
                        label="User Name"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        onFocus={() => setIsUsernameFocused(true)}
                        onBlur={() => setIsUsernameFocused(false)}
                        required
                        inputProps={{ maxLength: 14 }}
                        sx={textFieldSx}
                    />
                    {isUsernameFocused && (
                        <ValidationPopup requirements={usernameRequirements} value={username} />
                    )}
                </div>
                {username.length > 0 && usernameFeedbackStatus !== 'invalid' && (
                    <UsernameFeedbackComponent
                        status={usernameFeedbackStatus}
                        result={availability.result}
                        error={usernameFeedbackError}
                        onSuggestion={setUsername}
                    />
                )}
            </div>
            <button
                onClick={handleUsernameSubmit}
                disabled={!availability.isAvailable || hasCapitalLetters || isUsernameSubmitting}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${!availability.isAvailable || hasCapitalLetters || isUsernameSubmitting
                    ? "bg-[#4182CF]/47 text-white/50 cursor-not-allowed"
                    : "bg-[#4182CF] hover:bg-[#4B8EDF] text-white"
                    }`}
            >
                {isUsernameSubmitting ? <LoadingSpinner /> : "Continue"}
            </button>
        </div>
    );
};
