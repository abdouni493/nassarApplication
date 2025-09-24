import { useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const texts = {
  fr: {
    headerTitle: "Générateur de Tickets",
    headerSubtitle: "Créez un ticket avec code-barres",
    generateCardTitle: "Nouveau Ticket",
    barcodeLabel: "Numéro du Code-Barres",
    productLabel: "Nom du produit",
    priceLabel: "Prix",
    placeholder: "Entrez un numéro",
    placeholderProduct: "Nom du produit",
    placeholderPrice: "Prix",
    randomButton: "Aléatoire",
    generateButton: "Générer & Voir l'Aperçu",
    previewTitle: "Aperçu du Ticket",
    printDocumentTitle: "Impression Ticket",
    noCode: "Pas de code généré",
    closeButton: "Fermer",
    printButton: "Imprimer",
    toastErrorTitle: "Erreur",
    toastErrorMessage: "Veuillez saisir toutes les informations.",
  },
  ar: {
    headerTitle: "مولد التذاكر",
    headerSubtitle: "إنشاء تذكرة مع رمز شريطي",
    generateCardTitle: "تذكرة جديدة",
    barcodeLabel: "رقم الرمز الشريطي",
    productLabel: "اسم المنتج",
    priceLabel: "السعر",
    placeholder: "أدخل رقما",
    placeholderProduct: "اسم المنتج",
    placeholderPrice: "السعر",
    randomButton: "عشوائي",
    generateButton: "إنشاء ومعاينة",
    previewTitle: "معاينة التذكرة",
    printDocumentTitle: "طباعة التذكرة",
    noCode: "لم يتم إنشاء رمز",
    closeButton: "إغلاق",
    printButton: "طباعة",
    toastErrorTitle: "خطأ",
    toastErrorMessage: "الرجاء إدخال جميع المعلومات.",
  },
};

// --- Utility: Generate valid EAN-13 ---
function generateEAN13(): string {
  let digits = "";
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  const checkDigit = calcEAN13CheckDigit(digits);
  return digits + checkDigit;
}
function calcEAN13CheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(digits[i]);
    sum += i % 2 === 0 ? n : n * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export default function Barcodes() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();

  const [barcodeText, setBarcodeText] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const generateRandomBarcodeText = () => {
    const code = generateEAN13();
    setBarcodeText(code);
  };

  const generateBarcode = () => {
    if (!barcodeText || !productName || !price) {
      toast({
        title: texts[language].toastErrorTitle,
        description: texts[language].toastErrorMessage,
        variant: "destructive",
      });
      return;
    }

    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeText, {
      format: "EAN13",
      displayValue: true,
      fontSize: 14,
      width: 2,
      height: 60,
      margin: 5,
    });

    const imgData = canvas.toDataURL("image/png");
    setBarcodeImage(imgData);
    setPrintDialogOpen(true);
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${texts[language].printDocumentTitle}</title>
              <style>
                body { margin:0; padding:0; font-family: monospace; }
                .ticket { width:220px; padding:4px; text-align:center; }
                .title { font-weight:bold; font-size:14px; }
                .price { font-size:12px; margin-bottom:4px; }
                img { width:100%; }
              </style>
            </head>
            <body>${printContent.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 300);
      }
    }
  };

  return (
    <div
      className={`space-y-6 p-4 md:p-8 max-w-xl mx-auto animate-fade-in ${
        isRTL ? "rtl" : "ltr"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {texts[language].headerTitle}
          </h1>
          <p className="text-muted-foreground text-lg">
            {texts[language].headerSubtitle}
          </p>
        </div>
        <QrCode className="h-10 w-10 text-primary" />
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl p-4">
          <CardTitle className="text-xl font-semibold">
            {texts[language].generateCardTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div>
            <Label>{texts[language].productLabel}</Label>
            <Input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={texts[language].placeholderProduct}
            />
          </div>
          <div>
            <Label>{texts[language].priceLabel}</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={texts[language].placeholderPrice}
            />
          </div>
          <div>
            <Label>{texts[language].barcodeLabel}</Label>
            <div className="flex mt-1">
              <Input
                type="text"
                value={barcodeText}
                onChange={(e) =>
                  setBarcodeText(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder={texts[language].placeholder}
              />
              <Button
                onClick={generateRandomBarcodeText}
                className="rounded-r-md bg-gray-200 text-gray-800"
              >
                {texts[language].randomButton}
              </Button>
            </div>
          </div>
          <Button
            onClick={generateBarcode}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3"
          >
            <Printer className="mr-2 h-5 w-5" /> {texts[language].generateButton}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle>{texts[language].previewTitle}</DialogTitle>
          </DialogHeader>

          <div
            ref={printAreaRef}
            className="ticket border rounded bg-white p-2 text-center"
          >
            <div className="title">{productName}</div>
            <div className="price">{price} DZD</div>
            {barcodeImage ? (
              <img src={barcodeImage} alt="barcode" />
            ) : (
              <p>{texts[language].noCode}</p>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              {texts[language].closeButton}
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-primary text-white"
              disabled={!barcodeImage}
            >
              <Printer className="mr-2 h-4 w-4" />{" "}
              {texts[language].printButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
