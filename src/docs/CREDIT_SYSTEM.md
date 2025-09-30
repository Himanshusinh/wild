# Credit Management System

This document describes the comprehensive credit management system implemented in the frontend using Redux for state management and validation.

## Overview

The credit system provides:
- **Frontend validation** before generation starts
- **Optimistic updates** for immediate UI feedback
- **Transaction tracking** with rollback capability
- **Real-time sync** with backend
- **Comprehensive error handling**

## Architecture

### 1. Redux Store (`creditsSlice.ts`)
- **State Management**: Centralized credit balance and transaction history
- **Async Actions**: Credit fetching, validation, reservation, and confirmation
- **Optimistic Updates**: Immediate UI updates with rollback capability

### 2. Credit Validation (`creditValidation.ts`)
- **Model Pricing**: Maps all models to their credit costs
- **Dynamic Calculation**: Supports MiniMax video models with resolution/duration
- **Validation Logic**: Checks sufficient credits before generation

### 3. Credit Distribution (`creditDistribution.ts`)
- **Pricing Data**: Complete model pricing from backend
- **Helper Functions**: Easy access to model costs and plans
- **Provider Support**: BFL, MiniMax, Runway, Google models

### 4. React Hooks (`useCredits.ts`)
- **useCredits**: Main hook for credit operations
- **useGenerationCredits**: Specialized hook for generation components
- **Automatic Validation**: Pre-validates credits before generation

## Usage

### Basic Credit Operations

```typescript
import { useCredits } from '@/hooks/useCredits';

const MyComponent = () => {
  const {
    creditBalance,
    loading,
    error,
    validateVideoCredits,
    reserveCreditsForGeneration,
    confirmGenerationSuccess,
    confirmGenerationFailure,
  } = useCredits();

  // Validate credits for a specific model
  const validateCredits = async () => {
    try {
      await validateVideoCredits('minimax', 'MiniMax-Hailuo-02', '1080P', 6);
      // Proceed with generation
    } catch (error) {
      // Handle insufficient credits
    }
  };
};
```

### Generation Components

```typescript
import { useGenerationCredits } from '@/hooks/useCredits';

const VideoGeneration = () => {
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    error,
  } = useGenerationCredits('video', selectedModel, {
    resolution: selectedResolution,
    duration: selectedDuration,
  });

  const handleGenerate = async () => {
    let transactionId: string;
    
    try {
      // Validate and reserve credits
      const result = await validateAndReserveCredits('minimax');
      transactionId = result.transactionId;
      
      // Start generation...
      const generationResult = await startGeneration();
      
      // Confirm success
      await handleGenerationSuccess(transactionId);
    } catch (error) {
      // Handle failure and rollback credits
      await handleGenerationFailure(transactionId);
    }
  };
};
```

### Credit Display

```typescript
import { CreditsDisplay } from '@/components/ui/CreditsDisplay';

// Basic display
<CreditsDisplay />

// Custom styling
<CreditsDisplay 
  showIcon={false}
  showLabel={true}
  className="text-lg font-bold"
/>
```

## Credit Flow

### 1. Pre-Generation Validation
```typescript
// Check if user has enough credits
const validation = await validateCreditRequirement({
  requiredCredits: 1100,
  modelName: 'MiniMax-Hailuo-02'
});
```

### 2. Credit Reservation
```typescript
// Reserve credits optimistically
const reservation = await reserveCredits({
  amount: 1100,
  reason: 'video-generation',
  metadata: { model: 'MiniMax-Hailuo-02' }
});
```

### 3. Generation Process
```typescript
// Credits are deducted immediately for UI feedback
// Backend also validates and debits credits
// Both systems work independently for reliability
```

### 4. Confirmation/Rollback
```typescript
// On success - confirm transaction
await confirmCreditTransaction({ transactionId, success: true });

// On failure - rollback credits
await confirmCreditTransaction({ transactionId, success: false });
```

## Model Pricing

### MiniMax Video Models
- **MiniMax-Hailuo-02 512P 6s**: 320 credits
- **MiniMax-Hailuo-02 512P 10s**: 420 credits
- **MiniMax-Hailuo-02 768P 6s**: 680 credits
- **MiniMax-Hailuo-02 768P 10s**: 1240 credits
- **MiniMax-Hailuo-02 1080P 6s**: 1100 credits
- **T2V-01-Director**: 980 credits
- **I2V-01-Director**: 980 credits
- **S2V-01**: 1420 credits

### Runway Video Models
- **Gen-4 Turbo 5s**: 620 credits
- **Gen-4 Turbo 10s**: 1120 credits
- **Gen-3a Turbo 5s**: 620 credits
- **Gen-3a Turbo 10s**: 1120 credits
- **Gen-4 Aleph 10s**: 3120 credits

### Image Models
- **FLUX.1 Kontext [pro]**: 110 credits
- **FLUX.1 Kontext [max]**: 190 credits
- **FLUX 1.1 [pro] Ultra**: 150 credits
- **FLUX.1 [dev]**: 90 credits
- **FLUX.1 [pro]**: 130 credits

### Music Models
- **Music 1.5 (Up to 90s)**: 90 credits

## Error Handling

### Insufficient Credits
```typescript
try {
  await validateVideoCredits('minimax', 'MiniMax-Hailuo-02', '1080P', 6);
} catch (error) {
  // Error: "Insufficient credits. You need 1100 credits but only have 500. You're 600 credits short."
}
```

### Network Errors
```typescript
// Automatic retry and fallback to backend sync
const refreshCredits = async () => {
  await dispatch(syncCreditsWithBackend());
};
```

### Transaction Rollback
```typescript
// Automatic rollback on generation failure
await handleGenerationFailure(transactionId);
// Credits are restored to user's account
```

## Integration Points

### 1. Backend API
- **GET /api/auth/me**: Fetch user credits
- **POST /api/credits/me**: Update credit balance
- **Generation APIs**: Validate and debit credits

### 2. Redux Store
- **State**: `state.credits.credits.creditBalance`
- **Loading**: `state.credits.loading`
- **Error**: `state.credits.error`
- **Transactions**: `state.credits.transactions`

### 3. UI Components
- **Nav Component**: Displays current credit balance
- **Generation Components**: Validates before generation
- **Error Messages**: Shows insufficient credit warnings

## Benefits

1. **Immediate Feedback**: Users see credit deduction instantly
2. **Reliable Validation**: Both frontend and backend validate credits
3. **Transaction Safety**: Rollback capability prevents credit loss
4. **Performance**: Optimistic updates improve perceived performance
5. **User Experience**: Clear error messages and real-time updates
6. **Maintainability**: Centralized credit logic and pricing

## Future Enhancements

1. **Credit Packages**: Support for different credit plans
2. **Usage Analytics**: Track credit consumption patterns
3. **Bulk Operations**: Support for batch credit operations
4. **Credit History**: Detailed transaction history UI
5. **Notifications**: Low credit warnings and alerts
