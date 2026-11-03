const LAB_EXPERIMENTS = [
  {
    id: "standard_solution",
    name: "Standard Solution Preparation",
    aim: "To prepare a standard solution of a given concentration.",
    theory: "A standard solution is prepared by dissolving an accurately weighed mass of solute in a known volume of solvent. The molarity (M) is the number of moles of solute per liter of solution.",
    apparatus: "Volumetric flask, analytical balance, beaker, glass rod, funnel.",
    chemicals: "Sodium carbonate (Na2CO3) or Sodium chloride (NaCl), Distilled water.",
    procedure: [
      "Calculate the required mass of solute for the desired concentration and volume.",
      "Weigh the exact mass using an analytical balance.",
      "Transfer the solute to a beaker and dissolve it in a small amount of distilled water.",
      "Transfer the solution to a volumetric flask using a funnel.",
      "Rinse the beaker and add the washings to the flask.",
      "Make up the volume to the mark with distilled water and mix well."
    ],
    calculations: "Mass = Molarity × Volume(L) × Molar Mass",
    inference: "A standard solution of known molarity is successfully prepared.",
    precautions: "Ensure all solute is transferred. Read the lower meniscus at eye level.",
    viva: ["What is a standard solution?", "Why is a volumetric flask used instead of a beaker?"]
  },
  {
    id: "acid_base_titration",
    name: "Acid-Base Titration (HCl and NaOH)",
    aim: "To determine the exact concentration of a given HCl solution by titrating it against a standard NaOH solution.",
    theory: "Titration is a volumetric analysis technique. The neutralization reaction is: HCl + NaOH -> NaCl + H2O. Phenolphthalein is used as an indicator.",
    apparatus: "Burette, pipette, conical flask, retort stand, white tile.",
    chemicals: "0.1M NaOH (standard), unknown HCl, Phenolphthalein.",
    procedure: [
      "Pipette 25 mL of HCl into the conical flask.",
      "Add 2-3 drops of phenolphthalein indicator. Solution remains colorless.",
      "Fill the burette with 0.1M NaOH.",
      "Titrate until a permanent pale pink color appears.",
      "Record the burette reading and repeat for concordant values."
    ],
    calculations: "M1V1 (Acid) = M2V2 (Base). Calculate M1.",
    inference: "The endpoint marks the equivalence point of the neutralization.",
    precautions: "Ensure no air bubbles in the burette. Read the lower meniscus.",
    viva: ["What is an indicator?", "Why is the white tile used?"]
  },
  {
    id: "ph_determination",
    name: "pH Determination",
    aim: "To determine the pH of various solutions using universal indicator and a pH meter.",
    theory: "pH is a measure of the hydrogen ion concentration. pH = -log[H+]. Universal indicator changes color depending on the pH of the solution.",
    apparatus: "Test tubes, pH meter, droppers.",
    chemicals: "Various solutions (HCl, NaOH, vinegar, water, ammonia), Universal indicator.",
    procedure: [
      "Take 5 mL of each solution in separate test tubes.",
      "Add 2 drops of universal indicator to each.",
      "Observe the color and compare it with the pH color chart.",
      "Verify the results using a calibrated pH meter."
    ],
    calculations: "N/A",
    inference: "The pH of solutions determines their acidic, basic, or neutral nature.",
    precautions: "Calibrate the pH meter before use. Wash the electrode with distilled water between readings.",
    viva: ["Define pH.", "What is a universal indicator?"]
  },
  {
    id: "dilution",
    name: "Serial Dilution",
    aim: "To prepare a series of diluted solutions from a stock solution.",
    theory: "Dilution is the process of decreasing the concentration of a solute in solution, usually simply by mixing with more solvent. Formula: C1V1 = C2V2.",
    apparatus: "Volumetric flasks, pipettes, beakers.",
    chemicals: "Stock solution (e.g., 1.0M CuSO4), Distilled water.",
    procedure: [
      "Take a known volume of the stock solution using a pipette.",
      "Transfer it to a volumetric flask.",
      "Add distilled water up to the mark and mix well.",
      "Repeat the process using the newly prepared solution to create a series of dilutions."
    ],
    calculations: "C2 = (C1 × V1) / V2",
    inference: "The concentration decreases proportionally with the increase in volume.",
    precautions: "Use a clean pipette for each transfer.",
    viva: ["What is the principle of dilution?", "Why do we use serial dilution?"]
  },
  {
    id: "reaction_rate",
    name: "Reaction Rate (Iodine Clock)",
    aim: "To study the effect of concentration on the rate of reaction between iodate and bisulfite.",
    theory: "The rate of a chemical reaction is proportional to the concentration of the reactants. An iodine clock reaction produces a sudden color change (blue-black) when a certain amount of product is formed.",
    apparatus: "Beakers, stopwatches, measuring cylinders.",
    chemicals: "Potassium iodate (KIO3), Sodium bisulfite (NaHSO3), Starch solution.",
    procedure: [
      "Prepare solutions of varying concentrations of KIO3.",
      "Mix a specific volume of KIO3 with a constant volume of NaHSO3 and starch.",
      "Start the stopwatch immediately upon mixing.",
      "Stop the stopwatch when the solution suddenly turns blue-black.",
      "Repeat for different concentrations."
    ],
    calculations: "Rate ∝ 1 / time. Plot a graph of 1/t vs Concentration.",
    inference: "The rate of reaction increases as the concentration of reactants increases.",
    precautions: "Accurate timing is crucial. Maintain constant temperature.",
    viva: ["What is an iodine clock reaction?", "How does concentration affect the reaction rate?"]
  },
  {
    id: "beer_lambert",
    name: "Beer-Lambert Law",
    aim: "To verify the Beer-Lambert Law and determine the concentration of an unknown solution.",
    theory: "The Beer-Lambert Law states that the absorbance of a solution is directly proportional to its concentration (A = εbc).",
    apparatus: "Spectrophotometer or colorimeter, cuvettes.",
    chemicals: "Standard solutions of CuSO4 or KMnO4, Unknown solution.",
    procedure: [
      "Prepare a series of standard solutions of known concentrations.",
      "Measure the absorbance of each solution at the appropriate wavelength.",
      "Plot a calibration curve (Absorbance vs. Concentration).",
      "Measure the absorbance of the unknown solution and find its concentration from the graph."
    ],
    calculations: "Determine the slope of the calibration curve to find the molar absorptivity (ε).",
    inference: "Absorbance has a linear relationship with concentration.",
    precautions: "Ensure cuvettes are clean and free of fingerprints.",
    viva: ["State the Beer-Lambert Law.", "What is a blank solution?"]
  },
  {
    id: "solubility",
    name: "Solubility and Temperature",
    aim: "To determine the solubility of a salt at different temperatures and plot a solubility curve.",
    theory: "Solubility is the maximum amount of solute that can dissolve in a given amount of solvent at a specific temperature. For most solids, solubility increases with temperature.",
    apparatus: "Boiling tubes, thermometer, water bath, balance.",
    chemicals: "Potassium nitrate (KNO3), Distilled water.",
    procedure: [
      "Add a known mass of KNO3 to a known volume of water in a boiling tube.",
      "Heat the tube in a water bath until all the salt dissolves.",
      "Allow it to cool slowly and record the temperature at which crystals first appear.",
      "Repeat with different masses of KNO3.",
      "Plot a graph of Solubility (g/100g water) vs. Temperature."
    ],
    calculations: "Solubility = (Mass of solute / Mass of solvent) × 100",
    inference: "The solubility of KNO3 increases with an increase in temperature.",
    precautions: "Stir continuously while cooling to prevent supersaturation.",
    viva: ["Define solubility.", "What is a saturated solution?"]
  },
  {
    id: "heat_neutralization",
    name: "Heat of Neutralization",
    aim: "To determine the enthalpy change of neutralization for a strong acid and a strong base.",
    theory: "The heat of neutralization is the heat evolved when one mole of water is formed by the reaction of an acid and a base. For a strong acid and strong base, it is approximately -57.1 kJ/mol.",
    apparatus: "Calorimeter (or insulated cup), thermometer, measuring cylinders.",
    chemicals: "1.0M HCl, 1.0M NaOH.",
    procedure: [
      "Measure 50 mL of 1.0M HCl and 50 mL of 1.0M NaOH into separate containers.",
      "Record the initial temperature of both solutions (they should be the same).",
      "Mix the two solutions quickly in a calorimeter and stir.",
      "Record the maximum temperature reached.",
      "Calculate the heat evolved."
    ],
    calculations: "q = mcΔT, ΔH = -q / n",
    inference: "The reaction is exothermic. The enthalpy of neutralization is calculated.",
    precautions: "Minimize heat loss to the surroundings.",
    viva: ["What is an exothermic reaction?", "Why is an insulated cup used?"]
  },
  {
    id: "stoichiometry",
    name: "Stoichiometry of a Precipitation Reaction",
    aim: "To determine the limiting reactant and calculate the theoretical yield of a precipitate.",
    theory: "Stoichiometry is the calculation of reactants and products in chemical reactions. The limiting reactant determines the maximum amount of product that can be formed.",
    apparatus: "Beakers, filter paper, funnel, balance, drying oven.",
    chemicals: "0.1M Barium chloride (BaCl2), 0.1M Sodium sulfate (Na2SO4).",
    procedure: [
      "Mix known volumes of BaCl2 and Na2SO4 solutions.",
      "A white precipitate of BaSO4 forms.",
      "Filter the precipitate using pre-weighed filter paper.",
      "Wash, dry, and weigh the precipitate.",
      "Compare the actual yield with the theoretical yield."
    ],
    calculations: "Determine limiting reactant. Theoretical Yield = moles of limiting reactant × molar mass of BaSO4.",
    inference: "The mass of the product depends on the limiting reactant.",
    precautions: "Wash the precipitate thoroughly to remove soluble impurities.",
    viva: ["What is a limiting reactant?", "How do you calculate percentage yield?"]
  },
  {
    id: "electrochemistry",
    name: "Electrochemical Cells",
    aim: "To construct a galvanic cell and measure its electromotive force (EMF).",
    theory: "A galvanic cell converts chemical energy into electrical energy through spontaneous redox reactions. E_cell = E_cathode - E_anode.",
    apparatus: "Beakers, voltmeter, connecting wires, salt bridge.",
    chemicals: "Zinc strip, Copper strip, 1M ZnSO4 solution, 1M CuSO4 solution.",
    procedure: [
      "Place the Zn strip in ZnSO4 solution (anode half-cell).",
      "Place the Cu strip in CuSO4 solution (cathode half-cell).",
      "Connect the two half-cells with a salt bridge.",
      "Connect the electrodes to a voltmeter.",
      "Record the cell voltage (EMF)."
    ],
    calculations: "Compare measured EMF with the theoretical value using standard reduction potentials.",
    inference: "Electrons flow from the zinc anode to the copper cathode.",
    precautions: "Ensure the salt bridge is properly soaked and makes contact with both solutions.",
    viva: ["What is the function of a salt bridge?", "Which electrode is the anode?"]
  }
];
