/**
 * Configuration des polices pour pdfMake
 * 
 * Note: pdfMake utilise les polices système disponibles.
 * La police 'Courier' devrait être disponible sur la plupart des systèmes.
 * Si elle n'est pas disponible, pdfMake utilisera une police par défaut.
 */

// Pour utiliser une police personnalisée, il faudrait :
// 1. Télécharger les fichiers .ttf de la police
// 2. Les convertir en base64
// 3. Les ajouter au VFS (Virtual File System) de pdfMake

// Pour l'instant, nous utilisons les polices système disponibles
// La police 'Courier' est généralement disponible sur tous les systèmes

export const configureCourierFont = (pdfMake) => {
  // Vérifier si pdfMake est disponible
  if (!pdfMake) {
    console.warn('⚠️ pdfMake n\'est pas disponible');
    return;
  }

  // pdfMake utilise les polices système par défaut
  // 'Courier' devrait être disponible sur la plupart des systèmes
  // Si ce n'est pas le cas, pdfMake utilisera une police par défaut
  
  // Note: Pour charger une police personnalisée, il faudrait :
  // 1. Télécharger le fichier .ttf
  // 2. Le convertir en base64
  // 3. L'ajouter au VFS comme ceci:
  /*
  pdfMake.vfs['Courier-Regular.ttf'] = 'base64EncodedFontData';
  pdfMake.fonts = {
    Courier: {
      normal: 'Courier-Regular.ttf',
      bold: 'Courier-Regular.ttf',
      italics: 'Courier-Regular.ttf',
      bolditalics: 'Courier-Regular.ttf'
    }
  };
  */
  
  // Pour l'instant, on utilise simplement le nom de la police système
  // qui devrait être disponible
  return pdfMake;
};

export default configureCourierFont;

