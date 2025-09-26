-- Add NFT-related columns to certificates table
ALTER TABLE public.certificates 
ADD COLUMN nft_token_id TEXT,
ADD COLUMN nft_collection_id TEXT;

-- Remove old HCS-related columns that are no longer needed
ALTER TABLE public.certificates 
DROP COLUMN IF EXISTS hedera_topic_id,
DROP COLUMN IF EXISTS hedera_sequence_number;

-- Create index for efficient NFT lookups
CREATE INDEX idx_certificates_nft_token_id ON public.certificates(nft_token_id);
CREATE INDEX idx_certificates_nft_collection_id ON public.certificates(nft_collection_id);