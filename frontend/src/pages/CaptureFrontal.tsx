{/* Animação de Scan Baseada em Gradiente */}
          {isScanning && (
            <div 
              className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D3AB39] to-transparent"
              style={{ animation: 'scan_2s 2s linear infinite' }}
            />
          )}