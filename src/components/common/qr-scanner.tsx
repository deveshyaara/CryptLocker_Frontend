'use client';

import * as React from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ open, onClose, onScanSuccess, onError }: QRScannerProps) {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const startScanning = async () => {
      try {
        setError(null);
        setIsScanning(true);
        
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanning();
            onClose();
          },
          (errorMessage) => {
            // Ignore not found errors as they're frequent during scanning
            if (errorMessage && !errorMessage.includes('No QR code found')) {
              setError(errorMessage);
              if (onError) {
                onError(errorMessage);
              }
            }
          }
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
        setError(errorMessage);
        setIsScanning(false);
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
  }, [open, onScanSuccess, onClose, onError]);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Position the QR code within the frame to scan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ minHeight: '300px' }}
          />
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          {!isScanning && !error && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>Initializing camera...</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

