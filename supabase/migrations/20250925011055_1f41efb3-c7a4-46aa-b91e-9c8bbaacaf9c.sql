-- Create certificates table to store certificate metadata
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  issuer_organization TEXT NOT NULL,
  course_name TEXT NOT NULL,
  completion_date DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_hash TEXT NOT NULL,
  ipfs_hash TEXT,
  hedera_topic_id TEXT,
  hedera_transaction_id TEXT UNIQUE,
  hedera_sequence_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'issued', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for certificate access
CREATE POLICY "Users can view their own certificates" 
ON public.certificates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates" 
ON public.certificates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates" 
ON public.certificates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_certificates_hedera_transaction_id ON public.certificates(hedera_transaction_id);
CREATE INDEX idx_certificates_certificate_hash ON public.certificates(certificate_hash);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);

-- Create verification logs table for tracking verification attempts
CREATE TABLE public.verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  hedera_transaction_id TEXT,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('transaction_id', 'file_hash')),
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on verification logs
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification logs (for public verification)
CREATE POLICY "Anyone can log verifications" 
ON public.verification_logs 
FOR INSERT 
WITH CHECK (true);

-- Only allow viewing verification logs for certificate owners
CREATE POLICY "Users can view logs for their certificates" 
ON public.verification_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.certificates 
  WHERE certificates.id = verification_logs.certificate_id 
  AND certificates.user_id = auth.uid()
));