import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';

import { User } from '../models/User.js';
import { CompanySetting } from '../models/CompanySetting.js';
import { MarkupMatrix } from '../models/MarkupMatrix.js';
import { Customer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { Estimate } from '../models/Estimate.js';
import { Authorization } from '../models/Authorization.js';
import { Deposit } from '../models/Deposit.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { TechnicianWorksheet } from '../models/TechnicianWorksheet.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { DailyCashUp } from '../models/DailyCashUp.js';
import { ComputerModificationRequest } from '../models/ComputerModificationRequest.js';
import { SecurityIncident } from '../models/SecurityIncident.js';
import { DailySecurityChecklist } from '../models/DailySecurityChecklist.js';
import { Task } from '../models/Task.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

export async function seedDatabase(shouldConnect = true) {
  console.log('[Seed] Starting database population for Freedom Car & Truck...');
  if (shouldConnect && mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    CompanySetting.deleteMany({}),
    MarkupMatrix.deleteMany({}),
    Customer.deleteMany({}),
    Vehicle.deleteMany({}),
    Estimate.deleteMany({}),
    Authorization.deleteMany({}),
    Deposit.deleteMany({}),
    RepairOrder.deleteMany({}),
    TechnicianWorksheet.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    DailyCashUp.deleteMany({}),
    ComputerModificationRequest.deleteMany({}),
    SecurityIncident.deleteMany({}),
    DailySecurityChecklist.deleteMany({}),
    Task.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('[Seed] Cleaned existing collections.');

  // 1. Company Settings
  const companySetting = await CompanySetting.create({
    companyName: 'Freedom Car & Truck',
    legalName: 'Freedom Car & Truck Workshop Systems LLC',
    tagline: 'Commercial Fleet Maintenance & Heavy Duty Automotive Services',
    address: {
      street: '1244 Freedom Industrial Blvd',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    },
    phone: '(214) 555-0199',
    email: 'service@freedomcartruck.com',
    website: 'https://freedomcartruck.com',
    licenseNumber: 'TX-MV-849201-COMM',
    epaFacilityId: 'EPA-TXR-904318',
    taxRateDefault: 0.0825,
    laborRateDefault: 145.0,
    tireMarkupFlat: 20.0, // SW-005
    depositThreshold: 500.0, // SW-008
    depositPercentage: 50.0, // SW-008
    drawerClosingTarget: 100.0, // SW-015
    mitchellManagerIntegrationEnabled: false,
    electronicPartsCatalogUrl: 'https://catalog.electronicpartsmanager.internal/freedom',
  });

  // 2. Parts Markup Matrix (SW-004)
  const markupMatrix = await MarkupMatrix.create({
    name: 'Freedom Approved Parts Markup Matrix',
    isActive: true,
    tireFlatMarkup: 20.0,
    laborRateDefault: 145.0,
    tiers: [
      { minCost: 0.0, maxCost: 25.0, markupPercent: 100.0, multiplier: 2.0, marginPercent: 50.0 },
      { minCost: 25.01, maxCost: 50.0, markupPercent: 80.0, multiplier: 1.8, marginPercent: 44.4 },
      { minCost: 50.01, maxCost: 100.0, markupPercent: 60.0, multiplier: 1.6, marginPercent: 37.5 },
      { minCost: 100.01, maxCost: 300.0, markupPercent: 45.0, multiplier: 1.45, marginPercent: 31.0 },
      { minCost: 300.01, maxCost: 1000.0, markupPercent: 35.0, multiplier: 1.35, marginPercent: 25.9 },
      { minCost: 1000.01, maxCost: 999999.0, markupPercent: 25.0, multiplier: 1.25, marginPercent: 20.0 },
    ],
  });

  // 3. Employees across all 6 roles
  const users = await User.create([
    {
      employeeId: 'EMP-1001',
      name: 'Robert Miller',
      email: 'admin@freedomcartruck.com',
      password: 'Password123!',
      role: 'admin',
      phone: '(214) 555-1001',
      department: 'Executive Administration',
      status: 'active',
      passwordPolicyAcknowledged: true,
    },
    {
      employeeId: 'EMP-1002',
      name: 'David Sterling',
      email: 'manager@freedomcartruck.com',
      password: 'Password123!',
      role: 'manager',
      phone: '(214) 555-1002',
      department: 'Workshop Management',
      status: 'active',
      passwordPolicyAcknowledged: true,
    },
    {
      employeeId: 'EMP-1003',
      name: 'Sarah Jenkins',
      email: 'writer@freedomcartruck.com',
      password: 'Password123!',
      role: 'service_writer',
      phone: '(214) 555-1003',
      department: 'Service Reception',
      status: 'active',
      passwordPolicyAcknowledged: true,
    },
    {
      employeeId: 'EMP-1004',
      name: 'Marcus Cole',
      email: 'tech1@freedomcartruck.com',
      password: 'Password123!',
      role: 'technician',
      phone: '(214) 555-1004',
      department: 'Heavy Mechanical Bay 1',
      status: 'active',
      passwordPolicyAcknowledged: true,
    },
    {
      employeeId: 'EMP-1005',
      name: 'Alexander Hayes',
      email: 'tech2@freedomcartruck.com',
      password: 'Password123!',
      role: 'qc_technician',
      phone: '(214) 555-1005',
      department: 'Quality Assurance & Diagnostic Bay',
      status: 'active',
      passwordPolicyAcknowledged: true,
    },
    {
      employeeId: 'EMP-1006',
      name: 'Emily Watson',
      email: 'office@freedomcartruck.com',
      password: 'Password123!',
      role: 'office_assistant',
      phone: '(214) 555-1006',
      department: 'Operations & Compliance Office',
      status: 'active',
      passwordPolicyAcknowledged: true,
    },
  ]);

  const [adminUser, managerUser, writerUser, tech1User, tech2User, officeUser] = users;

  // 4. Customers
  const customers = await Customer.create([
    {
      customerNumber: 'CUST-2025-0001',
      name: 'Lone Star Logistics LLC',
      phone: '(214) 892-4410',
      email: 'fleet@lonestarlogistics.com',
      address: {
        street: '8800 Commerce Way',
        city: 'Irving',
        state: 'TX',
        zip: '75063',
      },
      notes: 'Commercial fleet client - 14 heavy duty service trucks. High priority turn-around.',
      status: 'vip',
      registrationDate: new Date('2025-01-10'),
      vehicles: [],
    },
    {
      customerNumber: 'CUST-2025-0002',
      name: 'Dallas Hauling & Freight Corp',
      phone: '(469) 330-8812',
      email: 'dispatch@dallashaulingcorp.com',
      address: {
        street: '410 Industrial Park Dr',
        city: 'Garland',
        state: 'TX',
        zip: '75040',
      },
      notes: 'Net-30 account approved. Demands written quote on all work exceeding $1,000.',
      status: 'active',
      registrationDate: new Date('2025-01-15'),
      vehicles: [],
    },
    {
      customerNumber: 'CUST-2025-0003',
      name: 'Elena Rodriguez',
      phone: '(972) 414-9921',
      email: 'elena.rodriguez77@gmail.com',
      address: {
        street: '3412 Meadowview Rd',
        city: 'Plano',
        state: 'TX',
        zip: '75075',
      },
      notes: 'Retail customer. Always requests old parts returned.',
      status: 'active',
      registrationDate: new Date('2025-02-01'),
      vehicles: [],
    },
  ]);

  // 5. Vehicles
  const vehicles = await Vehicle.create([
    {
      customer: customers[0]._id,
      vin: '1FT8W3BT9NEC14902',
      licensePlate: 'TX-LSL-101',
      year: 2022,
      make: 'Ford',
      model: 'F-350 Super Duty',
      subModel: 'Crew Cab 6.7L PowerStroke Diesel 4x4',
      engine: '6.7L V8 PowerStroke Turbo Diesel',
      color: 'Oxford White',
      currentMileage: 64280,
      previousMileage: 58900,
      unitNumber: 'UNIT-12',
      registrationDetails: { state: 'TX', expirationDate: '2026-08' },
      outstandingIssues: ['Brake pulsation under load', 'Fuel filter service overdue'],
    },
    {
      customer: customers[1]._id,
      vin: '1GC4YNEY1NF109283',
      licensePlate: 'TX-DHF-204',
      year: 2023,
      make: 'Chevrolet',
      model: 'Silverado 2500HD',
      subModel: 'Work Truck Duramax Diesel',
      engine: '6.6L V8 Duramax Turbo Diesel',
      color: 'Summit White',
      currentMileage: 48120,
      previousMileage: 41000,
      unitNumber: 'TRUCK-07',
      registrationDetails: { state: 'TX', expirationDate: '2026-11' },
      outstandingIssues: ['Tire tread down to 4/32 on steer axle', 'Oil pressure sensor intermittent'],
    },
    {
      customer: customers[2]._id,
      vin: '3C6UR5FL8MG198342',
      licensePlate: 'TX-ROD-882',
      year: 2021,
      make: 'Ram',
      model: '2500',
      subModel: 'Big Horn 4x4',
      engine: '6.4L HEMI V8',
      color: 'Granite Crystal Metallic',
      currentMileage: 52400,
      previousMileage: 45000,
      registrationDetails: { state: 'TX', expirationDate: '2026-05' },
      outstandingIssues: ['Check engine light P0300', 'Power steering whining when cold'],
    },
  ]);

  // Link vehicles to customers
  customers[0].vehicles.push(vehicles[0]._id as any);
  await customers[0].save();

  customers[1].vehicles.push(vehicles[1]._id as any);
  await customers[1].save();

  customers[2].vehicles.push(vehicles[2]._id as any);
  await customers[2].save();

  // 6. Complete SOP Tasks list (SW-001..015, TECH-001..013, OFF-001..012)
  const sopTasksData = [
    // Service Writer Tasks (SW-001 to SW-015)
    {
      taskId: 'TSK-SW-001',
      sopId: 'SW-001',
      title: 'Customer Profile Creation & Verification',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Customer arrival at workshop reception',
      checklist: [
        { item: 'Verify customer full legal name / company name', completed: true },
        { item: 'Verify contact phone number and email', completed: true },
        { item: 'Verify physical billing address', completed: true },
        { item: 'Confirm duplicate check performed', completed: true },
      ],
      requiredEvidence: 'Complete Customer Profile record in MongoDB',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-002',
      sopId: 'SW-002',
      title: 'Vehicle Registration & History Check',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Customer intake with vehicle in building',
      checklist: [
        { item: 'Record 17-digit VIN from door jamb / windshield', completed: true },
        { item: 'Record license plate and state', completed: true },
        { item: 'Record exact odometer mileage', completed: true },
        { item: 'Check previous vehicle service records', completed: true },
      ],
      requiredEvidence: 'Verified Vehicle record with odometer reading',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-003',
      sopId: 'SW-003',
      title: 'Customer Complaint & Itemized Estimate',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Vehicle intake review',
      checklist: [
        { item: 'Document verbatim customer concerns and symptoms', completed: true },
        { item: 'Itemize parts, labor hours, sublet, and shop supplies', completed: true },
        { item: 'Apply labor rate ($145.00/hr)', completed: true },
      ],
      requiredEvidence: 'Itemized Estimate record in system',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-004',
      sopId: 'SW-004',
      title: 'Parts Pricing Matrix Application',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Parts quoting during estimate preparation',
      checklist: [
        { item: 'Lookup actual acquisition cost from verified parts supplier', completed: true },
        { item: 'Apply company-approved markup matrix tier strictly', completed: true },
        { item: 'Do NOT use electronic parts manager default selling price', completed: true },
      ],
      requiredEvidence: 'Verified parts pricing calculations matching active matrix',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-005',
      sopId: 'SW-005',
      title: 'Tire Pricing Calculation (Cost + $20 Flat)',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Quoting tire replacements',
      checklist: [
        { item: 'Retrieve wholesale acquisition cost for specified tire size/load rating', completed: true },
        { item: 'Add exactly $20.00 flat markup per tire', completed: true },
        { item: 'Exclude tire pricing from percentage markup matrix', completed: true },
      ],
      requiredEvidence: 'Tire line item showing acquisition cost + $20.00 formula',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-006',
      sopId: 'SW-006',
      title: 'Repair Order Creation from Approved Estimate',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Approved estimate ready for shop conversion',
      checklist: [
        { item: 'Generate unique sequential RO number', completed: true },
        { item: 'Link customer and vehicle records to RO', completed: true },
        { item: 'Attach complaint and requested services', completed: true },
      ],
      requiredEvidence: 'Active Repair Order record in database',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-007',
      sopId: 'SW-007',
      title: 'Customer Authorization & Signature Capture',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Estimate presented to customer',
      checklist: [
        { item: 'Obtain digital customer signature on canvas before work begins', completed: true },
        { item: 'Verify customer signer full legal name and timestamp', completed: true },
        { item: 'Confirm agreement to estimate terms & limited warranty', completed: true },
      ],
      requiredEvidence: 'Authorization record with digital signature base64',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-008',
      sopId: 'SW-008',
      title: '50% Deposit Collection for Orders > $500',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Approved RO total exceeds $500.00',
      checklist: [
        { item: 'Calculate 50% deposit requirement', completed: true },
        { item: 'Collect deposit via cash/card/check prior to dispatch', completed: true },
        { item: 'Issue deposit receipt to customer and archive in system', completed: true },
      ],
      requiredEvidence: 'Deposit record showing status PAID',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-009',
      sopId: 'SW-009',
      title: 'Technician Dispatch Verification',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Ready to assign work order to technician',
      checklist: [
        { item: 'Enforce Rule 1: Customer authorization signature verified', completed: true },
        { item: 'Enforce Rule 2: 50% deposit verified if total > $500', completed: true },
        { item: 'Assign qualified technician #1 and update status to DISPATCHED', completed: true },
      ],
      requiredEvidence: 'Repair order marked DISPATCHED with technician link',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-010',
      sopId: 'SW-010',
      title: 'Final Worksheet Release Verification',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Vehicle repairs and inspections completed',
      checklist: [
        { item: 'Verify initial technician (Tech #1) signature present', completed: true },
        { item: 'Verify independent QC technician (Tech #2) signature present', completed: true },
        { item: 'Verify distinct employee IDs for Tech #1 and Tech #2', completed: true },
        { item: 'Confirm zero unresolved RED safety defects', completed: true },
        { item: 'Confirm vehicle exit observation passed', completed: true },
      ],
      requiredEvidence: 'TechnicianWorksheet marked RELEASE_READY by Service Writer',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-011',
      sopId: 'SW-011',
      title: 'Invoice Generation & Deposit Deduction',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'RO cleared for billing',
      checklist: [
        { item: 'Generate final itemized commercial invoice', completed: true },
        { item: 'Deduct collected deposit credit from balance due', completed: true },
        { item: 'Calculate accurate sales tax and shop fees', completed: true },
      ],
      requiredEvidence: 'Generated Invoice record linked to RO',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-012',
      sopId: 'SW-012',
      title: 'Customer Payment Processing',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Vehicle pickup and checkout',
      checklist: [
        { item: 'Process payment for invoice balance due (Cash, Card, Check)', completed: true },
        { item: 'Record transaction reference number', completed: true },
        { item: 'Update invoice balance to zero ($0.00) / status PAID', completed: true },
      ],
      requiredEvidence: 'Payment record linked to Invoice',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-013',
      sopId: 'SW-013',
      title: 'Dual Receipt Printing & Office Signature Archival',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Payment settlement',
      checklist: [
        { item: 'Generate printed/electronic Customer Receipt Copy', completed: true },
        { item: 'Capture customer physical/digital signature on Office Copy', completed: true },
        { item: 'Archive signed office receipt in company system', completed: true },
      ],
      requiredEvidence: 'Signed office receipt record in database',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-014',
      sopId: 'SW-014',
      title: 'Daily Paperwork Organization & Archival',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'End of business day closing',
      checklist: [
        { item: 'Organize completed repair orders by date and RO number', completed: false },
        { item: 'Verify all completed worksheets are attached to closed ROs', completed: false },
        { item: 'Complete daily closing paperwork checklist', completed: false },
      ],
      requiredEvidence: 'Daily paperwork closing checklist filed',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-SW-015',
      sopId: 'SW-015',
      title: 'Daily Register Reconciliation ($100 Exact Closing Balance)',
      department: 'SERVICE_WRITER',
      responsibleRole: 'Service Writer',
      assignedTo: writerUser._id,
      assignedEmployeeName: writerUser.name,
      triggerDescription: 'Daily cash drawer close-out',
      checklist: [
        { item: 'Count physical currency in register drawer', completed: false },
        { item: 'Calculate expected cash = Opening Float + Sales - Refunds - Paid-Outs', completed: false },
        { item: 'Ensure closing drawer float is exactly $100.00', completed: false },
        { item: 'Prepare bank deposit bag for remaining cash', completed: false },
        { item: 'Document explanation of variance if difference != 0', completed: false },
        { item: 'Sign Daily Cash-Up sheet and escalate any variance to Manager', completed: false },
      ],
      requiredEvidence: 'Signed DailyCashUp record and PDF document',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },

    // Automotive Technician Tasks (TECH-001 to TECH-013)
    {
      taskId: 'TSK-TECH-001',
      sopId: 'TECH-001',
      title: 'Technician Worksheet Intake Linking',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Vehicle enters service bay building',
      checklist: [
        { item: 'Create or locate worksheet linked to customer, vehicle, and RO', completed: true },
        { item: 'Record incoming vehicle odometer mileage on worksheet', completed: true },
        { item: 'Verify worksheet applies to all service types including minor maintenance', completed: true },
      ],
      requiredEvidence: 'TechnicianWorksheet record linked to RO in system',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-002',
      sopId: 'TECH-002',
      title: 'Two-Person Lighting Inspection Protocol',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Vehicle positioned in bay',
      checklist: [
        { item: 'Employee #1 operates vehicle interior controls', completed: true },
        { item: 'Employee #2 observes exterior lights from front and rear', completed: true },
        { item: 'Inspect low beams, high beams, turn signals, parking lights', completed: true },
        { item: 'Inspect brake lights, taillights, reverse lights, and third brake light', completed: true },
        { item: 'Record both employee IDs on worksheet', completed: true },
      ],
      requiredEvidence: 'Lighting inspection section completed with two employee signatures',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-003',
      sopId: 'TECH-003',
      title: 'Vehicle Lift Safety Inspection Verification',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Vehicle positioned on shop lift',
      checklist: [
        { item: 'Verify lift arms and rubber lift pads correctly positioned on chassis lift points', completed: true },
        { item: 'Raise vehicle 6 inches and conduct physical stability shake test', completed: true },
        { item: 'Engage mechanical safety lock before walking or working under vehicle', completed: true },
      ],
      requiredEvidence: 'Lift safety checkboxes signed and verified on worksheet',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-004',
      sopId: 'TECH-004',
      title: 'Full Vehicle Multi-Point Safety Inspection',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Vehicle elevated on lift',
      checklist: [
        { item: 'Inspect steering linkage, tie rods, and idler/pitman arms', completed: true },
        { item: 'Inspect front and rear suspension, ball joints, shocks/struts, and bushings', completed: true },
        { item: 'Inspect wheel bearings for free play and noise', completed: true },
        { item: 'Measure tire tread depth (32nds) and inspect wear patterns', completed: true },
        { item: 'Measure brake pad thickness (mm) and inspect rotors/drums', completed: true },
        { item: 'Inspect underbody, driveline, exhaust system, and engine/trans for leaks', completed: true },
      ],
      requiredEvidence: 'Multi-point inspection table completed with measurements',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-005',
      sopId: 'TECH-005',
      title: 'Inspection Classification (GREEN, YELLOW, RED)',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Evaluation of inspection findings',
      checklist: [
        { item: 'Classify acceptable components as GREEN', completed: true },
        { item: 'Classify components requiring future attention as YELLOW', completed: true },
        { item: 'Classify urgent safety/mechanical concerns as RED', completed: true },
        { item: 'Document clear customer-facing recommendations for all YELLOW/RED items', completed: true },
      ],
      requiredEvidence: 'Color-coded inspection status with documented findings and recommendations',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-006',
      sopId: 'TECH-006',
      title: 'Manufacturer Fluid Specification Verification',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Prior to dispensing or refilling any vehicle fluids',
      checklist: [
        { item: 'Look up OEM specified fluid type, viscosity/grade, and capacity', completed: true },
        { item: 'Confirm bulk tank or bottle matches exact OEM specification', completed: true },
        { item: 'Record verified fluid specification on worksheet before filling', completed: true },
      ],
      requiredEvidence: 'Verified fluid spec table in worksheet',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-007',
      sopId: 'TECH-007',
      title: 'Fluid Service & Leak Check Protocol',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Fluid exchange / service execution',
      checklist: [
        { item: 'Perform fluid service per manufacturer procedure', completed: true },
        { item: 'Torque all drain and fill plugs to factory specification', completed: true },
        { item: 'Run engine to operating temperature and verify hot/cold fluid levels', completed: true },
        { item: 'Perform visual inspection for active fluid leaks', completed: true },
      ],
      requiredEvidence: 'Fluid service verification signoff on worksheet',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-008',
      sopId: 'TECH-008',
      title: 'Initial Technician Signoff (Tech #1)',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Assigned repairs and initial inspections finished',
      checklist: [
        { item: 'Document notes on completed labor items', completed: true },
        { item: 'Sign initial technician signoff with digital signature', completed: true },
        { item: 'Record employee ID and timestamp', completed: true },
        { item: 'Queue vehicle for Independent QC inspection', completed: true },
      ],
      requiredEvidence: 'Tech #1 signature and timestamp recorded in worksheet',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-009',
      sopId: 'TECH-009',
      title: 'Independent Quality Control Verification (Tech #2)',
      department: 'QC_TECHNICIAN',
      responsibleRole: 'Independent QC Technician',
      assignedTo: tech2User._id,
      assignedEmployeeName: tech2User.name,
      triggerDescription: 'Vehicle queued in QC bay after Tech #1 signoff',
      checklist: [
        { item: 'Enforce Rule 4: Verify Tech #2 is a distinct employee from Tech #1', completed: false },
        { item: 'Independently verify all completed repair line items', completed: false },
        { item: 'Independently inspect all safety concerns, fluids, and leak checks', completed: false },
        { item: 'Verify lug nut torque with calibrated torque wrench', completed: false },
        { item: 'Confirm original customer complaint has been fully resolved', completed: false },
      ],
      requiredEvidence: 'Independent QC verification section completed by Tech #2',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-010',
      sopId: 'TECH-010',
      title: 'QC Discrepancy Escalation & Stop-Release Protocol',
      department: 'QC_TECHNICIAN',
      responsibleRole: 'Independent QC Technician',
      assignedTo: tech2User._id,
      assignedEmployeeName: tech2User.name,
      triggerDescription: 'Defect or discrepancy identified during QC check',
      checklist: [
        { item: 'Stop vehicle release immediately in the application', completed: false },
        { item: 'Document detailed discrepancy findings on worksheet', completed: false },
        { item: 'Assign corrective action back to primary technician', completed: false },
        { item: 'Perform mandatory reinspection prior to release clearance', completed: false },
      ],
      requiredEvidence: 'Documented discrepancy, corrective action, and reinspection results',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-011',
      sopId: 'TECH-011',
      title: 'Final QC Technician Signoff (Tech #2)',
      department: 'QC_TECHNICIAN',
      responsibleRole: 'Independent QC Technician',
      assignedTo: tech2User._id,
      assignedEmployeeName: tech2User.name,
      triggerDescription: 'QC inspection passed with zero discrepancies',
      checklist: [
        { item: 'Record Tech #2 digital signature and employee ID', completed: false },
        { item: 'Record QC pass timestamp', completed: false },
        { item: 'Clear vehicle for exit observation', completed: false },
      ],
      requiredEvidence: 'Tech #2 signature and timestamp recorded in worksheet',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-012',
      sopId: 'TECH-012',
      title: 'Vehicle Exit Observation & Rollout Leak Check',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'Vehicle moving out of bay toward delivery parking',
      checklist: [
        { item: 'Observe vehicle underside as vehicle rolls out of bay', completed: false },
        { item: 'Check for dripping fluids or trailing liquid marks on floor', completed: false },
        { item: 'Listen for abnormal exhaust leaks, squeals, or mechanical noises', completed: false },
        { item: 'Sign exit observation record on worksheet', completed: false },
      ],
      requiredEvidence: 'Vehicle Exit Observation section signed on worksheet',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-TECH-013',
      sopId: 'TECH-013',
      title: 'Worksheet Submission & Repair Order Attachment',
      department: 'TECHNICIAN',
      responsibleRole: 'Technician',
      assignedTo: tech1User._id,
      assignedEmployeeName: tech1User.name,
      triggerDescription: 'All service operations and inspections completed',
      checklist: [
        { item: 'Submit completed worksheet in application', completed: false },
        { item: 'Attach worksheet to parent Repair Order', completed: false },
        { item: 'Notify Service Writer of completion for billing and delivery', completed: false },
      ],
      requiredEvidence: 'Worksheet status marked RELEASE_READY and attached to RO',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },

    // Office Assistant SOPs (OFF-001 to OFF-012)
    {
      taskId: 'TSK-OFF-001',
      sopId: 'OFF-001',
      title: 'Authorized Company Accounts Compliance',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Daily operational compliance review',
      checklist: [
        { item: 'Verify all active workstations utilize @freedomcartruck.com credentials only', completed: true },
        { item: 'Confirm no unauthorized local admin accounts active', completed: true },
      ],
      requiredEvidence: 'Documented authorized accounts verification',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-002',
      sopId: 'OFF-002',
      title: 'Prohibition of Personal Webmail Accounts on Shop Terminals',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Workstation audit',
      checklist: [
        { item: 'Inspect browser sessions for personal Gmail, Yahoo, Outlook, or iCloud', completed: true },
        { item: 'Sign out and clear browser caches if personal webmail found', completed: true },
      ],
      requiredEvidence: 'Workstation webmail audit log',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-003',
      sopId: 'OFF-003',
      title: 'Prohibition of Personal Microsoft & OneDrive Synchronization',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Cloud storage audit',
      checklist: [
        { item: 'Verify OneDrive is configured strictly with company tenant accounts', completed: true },
        { item: 'Ensure personal cloud sync (Dropbox, Google Drive, iCloud) is disabled', completed: true },
      ],
      requiredEvidence: 'Cloud sync compliance status verified',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-004',
      sopId: 'OFF-004',
      title: 'Computer Modification Written Management Approval Mandate',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Software installation, setting change, or hardware upgrade requested',
      checklist: [
        { item: 'Enforce Rule 6: Prohibit modifications without approved CMR ticket', completed: true },
        { item: 'Direct employee to submit formal Computer Modification Request', completed: true },
      ],
      requiredEvidence: 'Policy acknowledgment on file',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-005',
      sopId: 'OFF-005',
      title: 'Computer Modification Request Submission Portal',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Employee request for application/setting modification',
      checklist: [
        { item: 'Record workstation identifier and software/setting name', completed: true },
        { item: 'Document detailed business reason and justification', completed: true },
        { item: 'Route to Manager or System Administrator queue', completed: true },
      ],
      requiredEvidence: 'Active ComputerModificationRequest record in database',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-006',
      sopId: 'OFF-006',
      title: 'Management Review & Documented Approval for Modifications',
      department: 'MANAGEMENT',
      responsibleRole: 'Manager / Approver',
      assignedTo: managerUser._id,
      assignedEmployeeName: managerUser.name,
      triggerDescription: 'Pending CMR ticket in manager queue',
      checklist: [
        { item: 'Evaluate security risk and operational necessity', completed: true },
        { item: 'Record management decision (APPROVED / REJECTED) with notes and timestamp', completed: true },
      ],
      requiredEvidence: 'Approved/Rejected CMR record with manager ID',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-007',
      sopId: 'OFF-007',
      title: 'Password-Saving & Auto-Login Prohibition Acknowledgment',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Employee onboarding and annual security re-certification',
      checklist: [
        { item: 'Present password-saving prohibition policy to employee', completed: true },
        { item: 'Capture employee signed acknowledgment in system', completed: true },
      ],
      requiredEvidence: 'EmployeeAcknowledgment record for PASSWORD_POLICY',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-008',
      sopId: 'OFF-008',
      title: 'Daily Workstation Locking & Security Walkthrough',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Workshop floor & front office closing routine',
      checklist: [
        { item: 'Physically inspect reception, bay terminals, and manager desks', completed: true },
        { item: 'Confirm all unattended workstations are locked (Win+L / Screen lock)', completed: true },
        { item: 'Record completed checklist with employee signature', completed: true },
      ],
      requiredEvidence: 'DailySecurityChecklist record for today',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-009',
      sopId: 'OFF-009',
      title: 'Daily Account Sign-Out Checklist',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'End of shift shutdown',
      checklist: [
        { item: 'Confirm all shared bay terminals have logged out of active user sessions', completed: true },
        { item: 'Verify point-of-sale terminal signed out', completed: true },
      ],
      requiredEvidence: 'DailySecurityChecklist signed record',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-010',
      sopId: 'OFF-010',
      title: 'Authorized Business-Data Storage Compliance Check',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Weekly electronic records compliance audit',
      checklist: [
        { item: 'Verify all estimates, invoices, and customer files reside in secure company database', completed: true },
        { item: 'Ensure no customer sensitive financial data is stored on local desktop drives or thumb drives', completed: true },
      ],
      requiredEvidence: 'Storage compliance verified on checklist',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-011',
      sopId: 'OFF-011',
      title: 'Individual Credentials Audit & Shared Access Prohibition',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Access control periodic review',
      checklist: [
        { item: 'Verify every employee operates under their unique EMP ID credential', completed: true },
        { item: 'Prohibit sharing of PINs or password credentials among technicians or writers', completed: true },
      ],
      requiredEvidence: 'Access control audit confirmation',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
    {
      taskId: 'TSK-OFF-012',
      sopId: 'OFF-012',
      title: 'Security Incident Reporting & Immediate Escalation',
      department: 'OFFICE_ASSISTANT',
      responsibleRole: 'Office Assistant',
      assignedTo: officeUser._id,
      assignedEmployeeName: officeUser.name,
      triggerDescription: 'Suspicious email, malware alert, or unauthorized physical/digital access',
      checklist: [
        { item: 'File security incident report immediately with severity classification', completed: true },
        { item: 'Isolate impacted workstation or network cable if needed', completed: true },
        { item: 'Escalate directly to Manager and System Administrator', completed: true },
      ],
      requiredEvidence: 'SecurityIncident record in system with management review',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 86400000),
      comments: [],
    },
  ];

  await Task.create(sopTasksData);
  console.log('[Seed] Populated all SOP Tasks (SW-001..015, TECH-001..013, OFF-001..012).');

  // 7. Sample Repair Orders across key operational states

  // Sample RO 1: Completed, Invoiced, and Paid (Lone Star Logistics F-350)
  const est1 = await Estimate.create({
    estimateNumber: 'EST-2025-0001',
    version: 1,
    customer: customers[0]._id,
    vehicle: vehicles[0]._id,
    mileageIn: 64280,
    customerComplaint: 'Brake pulsation under load, soft pedal, and requested complete fluid maintenance.',
    requestedServices: ['Heavy Duty Brake System Overhaul', 'Synthetic Oil Service', 'Two-Person Lighting Inspection'],
    lineItems: [
      {
        itemType: 'part',
        description: 'Motorcraft Super Duty Front Brake Rotors (Pair)',
        partNumber: 'BRRF-214',
        quantity: 1,
        costPrice: 140.0,
        sellingPrice: 203.0, // 45% markup
        subtotal: 203.0,
        markupApplied: 45,
      },
      {
        itemType: 'part',
        description: 'Severe Duty Semi-Metallic Front Brake Pads',
        partNumber: 'SD-1092',
        quantity: 1,
        costPrice: 42.0,
        sellingPrice: 75.6, // 80% markup
        subtotal: 75.6,
        markupApplied: 80,
      },
      {
        itemType: 'part',
        description: 'Valvoline Premium Blue 15W-40 Synthetic Diesel Oil (Gallons)',
        partNumber: 'OIL-15W40-SYN',
        quantity: 4,
        costPrice: 22.0,
        sellingPrice: 44.0, // 100% markup
        subtotal: 176.0,
        markupApplied: 100,
      },
      {
        itemType: 'part',
        description: 'Heavy Duty Diesel Oil Filter',
        partNumber: 'FL-2051S',
        quantity: 1,
        costPrice: 18.0,
        sellingPrice: 36.0, // 100% markup
        subtotal: 36.0,
        markupApplied: 100,
      },
      {
        itemType: 'tire',
        description: 'Michelin Agilis CrossClimate Commercial LT275/70R18',
        partNumber: 'MICH-AG-2757018',
        quantity: 2,
        costPrice: 245.0,
        sellingPrice: 265.0, // Cost + $20 flat per tire SW-005!
        subtotal: 530.0,
        markupApplied: 20,
      },
      {
        itemType: 'labor',
        description: 'Front Brake System Overhaul & Rotor Replacement',
        laborHours: 2.5,
        laborRatePerHour: 145.0,
        costPrice: 0,
        sellingPrice: 145.0,
        subtotal: 362.5,
      },
      {
        itemType: 'labor',
        description: 'Diesel Lube Oil Filter Service & Multi-Point Inspection',
        laborHours: 1.0,
        laborRatePerHour: 145.0,
        costPrice: 0,
        sellingPrice: 145.0,
        subtotal: 145.0,
      },
    ],
    partsTotal: 490.6,
    tiresTotal: 530.0,
    laborTotal: 507.5,
    shopSupplies: 35.53,
    subtotal: 1563.63,
    taxRate: 0.0825,
    taxAmount: 87.13,
    discount: 0,
    grandTotal: 1650.76,
    depositRequired: 825.38, // 50% of 1650.76 > $500
    depositMet: true,
    status: 'APPROVED',
    createdBy: writerUser._id,
  });

  const auth1 = await Authorization.create({
    authorizationNumber: 'AUTH-2025-0001',
    repairOrder: new mongoose.Types.ObjectId(), // placeholder
    estimate: est1._id,
    customer: customers[0]._id,
    authorizedTotal: 1650.76,
    approvedItems: ['Front Brake Overhaul', 'Michelin Agilis Tires (2)', 'Diesel Lube Service'],
    customerSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    customerSignerName: 'Dan Vance (Fleet Director)',
    signerPhone: '(214) 892-4410',
    signedAt: new Date(Date.now() - 7200000),
    authorizationType: 'INITIAL',
    serviceWriterWitness: writerUser._id,
    termsAccepted: true,
  });

  const dep1 = await Deposit.create({
    depositNumber: 'DEP-2025-0001',
    repairOrder: new mongoose.Types.ObjectId(), // placeholder
    estimate: est1._id,
    customer: customers[0]._id,
    requiredAmount: 825.38,
    paidAmount: 825.38,
    paymentMethod: 'CREDIT_CARD',
    transactionReference: 'AUTH_CHG_892014',
    collectedBy: writerUser._id,
    collectedAt: new Date(Date.now() - 7000000),
    status: 'APPLIED_TO_INVOICE',
  });

  const ro1 = await RepairOrder.create({
    roNumber: 'RO-2025-0001',
    customer: customers[0]._id,
    vehicle: vehicles[0]._id,
    mileageIn: 64280,
    mileageOut: 64284,
    customerComplaint: 'Brake pulsation under load, soft pedal, and requested complete fluid maintenance.',
    requestedServices: ['Heavy Duty Brake System Overhaul', 'Synthetic Oil Service', 'Two-Person Lighting Inspection'],
    currentEstimate: est1._id,
    authorization: auth1._id,
    deposit: dep1._id,
    status: 'PAID',
    serviceWriter: writerUser._id,
    assignedTechnician: tech1User._id,
    qcTechnician: tech2User._id,
    dispatchedAt: new Date(Date.now() - 6500000),
    timeline: [
      { status: 'INTAKE', timestamp: new Date(Date.now() - 8000000), performedBy: writerUser._id, notes: 'Vehicle intake completed.' },
      { status: 'ESTIMATE_CREATED', timestamp: new Date(Date.now() - 7500000), performedBy: writerUser._id, notes: 'Estimate #EST-2025-0001 created.' },
      { status: 'AUTHORIZED', timestamp: new Date(Date.now() - 7200000), performedBy: writerUser._id, notes: 'Customer signed authorization #AUTH-2025-0001.' },
      { status: 'DEPOSIT_PAID', timestamp: new Date(Date.now() - 7000000), performedBy: writerUser._id, notes: 'Collected $825.38 deposit #DEP-2025-0001.' },
      { status: 'DISPATCHED', timestamp: new Date(Date.now() - 6500000), performedBy: writerUser._id, notes: 'Dispatched to Tech #1 Marcus Cole.' },
      { status: 'TECH1_SIGNED', timestamp: new Date(Date.now() - 3600000), performedBy: tech1User._id, notes: 'Repairs completed and signed by Tech #1.' },
      { status: 'QC_APPROVED', timestamp: new Date(Date.now() - 2500000), performedBy: tech2User._id, notes: 'Independent QC verified by Tech #2 Alexander Hayes.' },
      { status: 'EXIT_OBSERVED', timestamp: new Date(Date.now() - 2000000), performedBy: tech1User._id, notes: 'Exit observation verified with zero leaks.' },
      { status: 'READY_FOR_INVOICE', timestamp: new Date(Date.now() - 1800000), performedBy: writerUser._id, notes: 'Service Writer verified dual technician signatures.' },
      { status: 'INVOICED', timestamp: new Date(Date.now() - 1500000), performedBy: writerUser._id, notes: 'Invoice #INV-2025-0001 generated.' },
      { status: 'PAID', timestamp: new Date(Date.now() - 900000), performedBy: writerUser._id, notes: 'Remaining balance paid in full. Customer and office receipts generated.' },
    ],
  });

  // Link back
  auth1.repairOrder = ro1._id as any;
  await auth1.save();

  dep1.repairOrder = ro1._id as any;
  await dep1.save();

  est1.repairOrder = ro1._id as any;
  await est1.save();

  // Create completed TechnicianWorksheet with dual technician verification
  const ws1 = await TechnicianWorksheet.create({
    worksheetNumber: 'TWS-2025-0001',
    repairOrder: ro1._id,
    vehicle: vehicles[0]._id,
    customer: customers[0]._id,
    recordedMileage: 64280,
    lightingInspection: {
      performed: true,
      operatorEmployee: tech1User._id,
      observerEmployee: writerUser._id,
      items: [
        { name: 'Low Beam Headlights', status: 'GREEN' },
        { name: 'High Beam Headlights', status: 'GREEN' },
        { name: 'Left Turn Signals', status: 'GREEN' },
        { name: 'Right Turn Signals', status: 'GREEN' },
        { name: 'Parking & Marker Lights', status: 'GREEN' },
        { name: 'Brake Lights', status: 'GREEN' },
        { name: 'Taillights', status: 'GREEN' },
        { name: 'Reverse Back-Up Lights', status: 'GREEN' },
        { name: 'Third Center Brake Light', status: 'GREEN' },
      ],
    },
    liftSafetyInspection: {
      performed: true,
      padsPositioned: true,
      locksEngaged: true,
      verifiedBy: tech1User._id,
      verifiedAt: new Date(Date.now() - 6000000),
    },
    fullVehicleInspection: {
      performed: true,
      items: [
        { name: 'Steering Components & Linkage', category: 'Underbody', status: 'GREEN' },
        { name: 'Front Suspension & Shocks', category: 'Suspension', status: 'GREEN' },
        { name: 'Front Brake Pads & Rotors', category: 'Braking', status: 'GREEN', measurement: '11mm (New)' },
        { name: 'Rear Brake Pads & Rotors', category: 'Braking', status: 'GREEN', measurement: '7mm' },
        { name: 'Tires Tread Depth', category: 'Wheels & Tires', status: 'GREEN', measurement: '12/32"' },
        { name: 'Engine Oil Leaks', category: 'Engine', status: 'GREEN' },
        { name: 'Transmission Leaks', category: 'Drivetrain', status: 'GREEN' },
        { name: 'Exhaust System', category: 'Exhaust', status: 'GREEN' },
      ],
      hasRedFlags: false,
      redFlagCount: 0,
      yellowFlagCount: 0,
    },
    fluidVerification: {
      performed: true,
      fluids: [
        { fluidName: 'Engine Oil 15W-40 CK-4', specVerified: true, levelOk: true, leakChecked: true },
        { fluidName: 'Transmission Fluid Mercon LV', specVerified: true, levelOk: true, leakChecked: true },
        { fluidName: 'Brake Fluid High-Temp DOT 4', specVerified: true, levelOk: true, leakChecked: true },
      ],
    },
    initialSignoff: {
      technician: tech1User._id,
      employeeId: tech1User.employeeId,
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signedAt: new Date(Date.now() - 3600000),
      laborCompletedNotes: 'Rotors replaced, pads seated, oil filter changed, tires mounted and balanced.',
    },
    qcInspection: {
      qcTechnician: tech2User._id, // DISTINCT EMPLOYEE ID (EMP-1005 != EMP-1004)
      employeeId: tech2User.employeeId,
      workCompletedVerified: true,
      safetyConcernsVerified: true,
      fluidsVerified: true,
      leaksVerified: true,
      lightsVerified: true,
      tiresTorquedVerified: true,
      fastenersTorquedVerified: true,
      originalComplaintResolved: true,
      discrepanciesFound: false,
      reinspectionResult: 'PASSED',
      reinspectedAt: new Date(Date.now() - 2500000),
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signedAt: new Date(Date.now() - 2500000),
    },
    exitObservation: {
      performed: true,
      observer: tech1User._id,
      observedAt: new Date(Date.now() - 2000000),
      leaksObservedOnExit: false,
      abnormalNoisesOrExhaust: false,
      exitPassed: true,
      exitNotes: 'Clean exit. No drips. Brake pedal firm.',
    },
    finalReleaseVerification: {
      verified: true,
      serviceWriter: writerUser._id,
      verifiedAt: new Date(Date.now() - 1800000),
      bothTechSignaturesVerified: true,
      allSafetyIssuesResolved: true,
      releasePermitted: true,
      notes: 'Worksheet audited and verified. All SOP checks passed.',
    },
    status: 'RELEASE_READY',
  });

  ro1.worksheet = ws1._id as any;

  // Invoice 1
  const inv1 = await Invoice.create({
    invoiceNumber: 'INV-2025-0001',
    repairOrder: ro1._id,
    customer: customers[0]._id,
    vehicle: vehicles[0]._id,
    lineItems: [
      { itemType: 'part', description: 'Motorcraft Super Duty Front Brake Rotors (Pair)', partNumber: 'BRRF-214', quantity: 1, unitPrice: 203.0, subtotal: 203.0 },
      { itemType: 'part', description: 'Severe Duty Semi-Metallic Front Brake Pads', partNumber: 'SD-1092', quantity: 1, unitPrice: 75.6, subtotal: 75.6 },
      { itemType: 'part', description: 'Valvoline Premium Blue 15W-40 Synthetic Diesel Oil (Gallons)', partNumber: 'OIL-15W40-SYN', quantity: 4, unitPrice: 44.0, subtotal: 176.0 },
      { itemType: 'part', description: 'Heavy Duty Diesel Oil Filter', partNumber: 'FL-2051S', quantity: 1, unitPrice: 36.0, subtotal: 36.0 },
      { itemType: 'tire', description: 'Michelin Agilis CrossClimate Commercial LT275/70R18', partNumber: 'MICH-AG-2757018', quantity: 2, unitPrice: 265.0, subtotal: 530.0 },
      { itemType: 'labor', description: 'Front Brake System Overhaul & Rotor Replacement', quantity: 1, unitPrice: 362.5, subtotal: 362.5 },
      { itemType: 'labor', description: 'Diesel Lube Oil Filter Service & Multi-Point Inspection', quantity: 1, unitPrice: 145.0, subtotal: 145.0 },
    ],
    partsTotal: 490.6,
    tiresTotal: 530.0,
    laborTotal: 507.5,
    shopSupplies: 35.53,
    taxRate: 0.0825,
    taxAmount: 87.13,
    discount: 0,
    subtotal: 1563.63,
    totalAmount: 1650.76,
    depositCredit: 825.38, // Deposit credit deducted
    balanceDue: 0.0, // Fully paid
    amountPaid: 825.38,
    status: 'PAID',
    issuedAt: new Date(Date.now() - 1500000),
    dueDate: new Date(Date.now() + 30 * 86400000),
    paidAt: new Date(Date.now() - 900000),
    createdBy: writerUser._id,
  });

  ro1.invoice = inv1._id as any;
  await ro1.save();

  // Payment 1
  await Payment.create({
    paymentNumber: 'PAY-2025-0001',
    invoice: inv1._id,
    repairOrder: ro1._id,
    customer: customers[0]._id,
    amount: 825.38,
    paymentMethod: 'CREDIT_CARD',
    referenceNumber: 'TX_CC_998124',
    processedBy: writerUser._id,
    processedAt: new Date(Date.now() - 900000),
    receiptNumber: 'REC-2025-0001',
    officeReceiptSigned: true,
    officeSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    notes: 'Remaining balance cleared. Customer signed office receipt.',
  });

  // Sample RO 2: In QC inspection (Chevy Silverado 2500HD)
  const est2 = await Estimate.create({
    estimateNumber: 'EST-2025-0002',
    version: 1,
    customer: customers[1]._id,
    vehicle: vehicles[1]._id,
    mileageIn: 48120,
    customerComplaint: 'Oil pressure sensor intermittent warning, replace front steer tires.',
    requestedServices: ['Oil Pressure Switch Replacement', 'Steer Axle Tires (2)', 'Full Safety Inspection'],
    lineItems: [
      {
        itemType: 'part',
        description: 'ACDelco Genuine GM Engine Oil Pressure Sensor',
        partNumber: '12673134',
        quantity: 1,
        costPrice: 58.0,
        sellingPrice: 92.8, // 60% markup tier ($50.01 - $100)
        subtotal: 92.8,
        markupApplied: 60,
      },
      {
        itemType: 'tire',
        description: 'Goodyear Wrangler Workhorse Commercial LT265/70R17',
        partNumber: 'GY-WRK-2657017',
        quantity: 2,
        costPrice: 195.0,
        sellingPrice: 215.0, // Cost + $20 flat markup SW-005!
        subtotal: 430.0,
        markupApplied: 20,
      },
      {
        itemType: 'labor',
        description: 'Replace Oil Pressure Sensor and Verify Gauge Function',
        laborHours: 1.5,
        laborRatePerHour: 145.0,
        costPrice: 0,
        sellingPrice: 145.0,
        subtotal: 217.5,
      },
      {
        itemType: 'labor',
        description: 'Mount & Road Force Balance Two Tires',
        laborHours: 0.8,
        laborRatePerHour: 145.0,
        costPrice: 0,
        sellingPrice: 145.0,
        subtotal: 116.0,
      },
    ],
    partsTotal: 92.8,
    tiresTotal: 430.0,
    laborTotal: 333.5,
    shopSupplies: 23.35,
    subtotal: 856.3,
    taxRate: 0.0825,
    taxAmount: 45.07,
    discount: 0,
    grandTotal: 924.72,
    depositRequired: 462.36, // 50% of 924.72
    depositMet: true,
    status: 'APPROVED',
    createdBy: writerUser._id,
  });

  const auth2 = await Authorization.create({
    authorizationNumber: 'AUTH-2025-0002',
    repairOrder: new mongoose.Types.ObjectId(),
    estimate: est2._id,
    customer: customers[1]._id,
    authorizedTotal: 924.72,
    approvedItems: ['Oil Pressure Sensor', 'Goodyear Tires (2)', 'Mount & Balance'],
    customerSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    customerSignerName: 'Carlos Mendez (Fleet Manager)',
    signedAt: new Date(Date.now() - 14400000),
    authorizationType: 'INITIAL',
    serviceWriterWitness: writerUser._id,
    termsAccepted: true,
  });

  const dep2 = await Deposit.create({
    depositNumber: 'DEP-2025-0002',
    repairOrder: new mongoose.Types.ObjectId(),
    estimate: est2._id,
    customer: customers[1]._id,
    requiredAmount: 462.36,
    paidAmount: 462.36,
    paymentMethod: 'FLEET_ACCOUNT',
    transactionReference: 'FLEET_PO_49201',
    collectedBy: writerUser._id,
    collectedAt: new Date(Date.now() - 14000000),
    status: 'PAID',
  });

  const ro2 = await RepairOrder.create({
    roNumber: 'RO-2025-0002',
    customer: customers[1]._id,
    vehicle: vehicles[1]._id,
    mileageIn: 48120,
    customerComplaint: 'Oil pressure sensor intermittent warning, replace front steer tires.',
    requestedServices: ['Oil Pressure Switch Replacement', 'Steer Axle Tires (2)', 'Full Safety Inspection'],
    currentEstimate: est2._id,
    authorization: auth2._id,
    deposit: dep2._id,
    status: 'QC_PENDING',
    serviceWriter: writerUser._id,
    assignedTechnician: tech1User._id,
    qcTechnician: tech2User._id,
    dispatchedAt: new Date(Date.now() - 12000000),
    timeline: [
      { status: 'INTAKE', timestamp: new Date(Date.now() - 16000000), performedBy: writerUser._id, notes: 'Vehicle checked in.' },
      { status: 'AUTHORIZED', timestamp: new Date(Date.now() - 14400000), performedBy: writerUser._id, notes: 'Authorized by Carlos Mendez.' },
      { status: 'DEPOSIT_PAID', timestamp: new Date(Date.now() - 14000000), performedBy: writerUser._id, notes: '50% deposit verified via Fleet PO.' },
      { status: 'DISPATCHED', timestamp: new Date(Date.now() - 12000000), performedBy: writerUser._id, notes: 'Dispatched to Tech #1 Marcus Cole.' },
      { status: 'TECH1_SIGNED', timestamp: new Date(Date.now() - 3600000), performedBy: tech1User._id, notes: 'Tech #1 completed sensor and tire mounting. Queued for QC.' },
    ],
  });

  auth2.repairOrder = ro2._id as any;
  await auth2.save();

  dep2.repairOrder = ro2._id as any;
  await dep2.save();

  est2.repairOrder = ro2._id as any;
  await est2.save();

  const ws2 = await TechnicianWorksheet.create({
    worksheetNumber: 'TWS-2025-0002',
    repairOrder: ro2._id,
    vehicle: vehicles[1]._id,
    customer: customers[1]._id,
    recordedMileage: 48120,
    lightingInspection: {
      performed: true,
      operatorEmployee: tech1User._id,
      observerEmployee: tech2User._id,
      items: [
        { name: 'Low Beam Headlights', status: 'GREEN' },
        { name: 'High Beam Headlights', status: 'GREEN' },
        { name: 'Turn Signals', status: 'GREEN' },
        { name: 'Brake Lights', status: 'GREEN' },
        { name: 'Reverse Back-Up Lights', status: 'GREEN' },
      ],
    },
    liftSafetyInspection: {
      performed: true,
      padsPositioned: true,
      locksEngaged: true,
      verifiedBy: tech1User._id,
      verifiedAt: new Date(Date.now() - 11000000),
    },
    fullVehicleInspection: {
      performed: true,
      items: [
        { name: 'Steering Linkage', category: 'Underbody', status: 'GREEN' },
        { name: 'Front Suspension', category: 'Suspension', status: 'GREEN' },
        { name: 'Brakes Front', category: 'Braking', status: 'GREEN', measurement: '8mm' },
        { name: 'Tires Front', category: 'Tires', status: 'GREEN', measurement: '11/32" (New)' },
        { name: 'Oil Pressure Gauge Reading', category: 'Engine', status: 'GREEN', measurement: '42 PSI hot idle' },
      ],
      hasRedFlags: false,
      redFlagCount: 0,
      yellowFlagCount: 0,
    },
    fluidVerification: {
      performed: true,
      fluids: [{ fluidName: 'Engine Oil', specVerified: true, levelOk: true, leakChecked: true }],
    },
    initialSignoff: {
      technician: tech1User._id,
      employeeId: tech1User.employeeId,
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signedAt: new Date(Date.now() - 3600000),
      laborCompletedNotes: 'Replaced oil pressure sensor. Torqued lug nuts to 140 lb-ft.',
    },
    qcInspection: {
      qcTechnician: undefined,
      employeeId: '',
      reinspectionResult: 'PENDING',
    },
    status: 'TECH1_COMPLETE',
  });

  ro2.worksheet = ws2._id as any;
  await ro2.save();

  // Sample RO 3: Awaiting Deposit (Ram 2500 retail)
  const est3 = await Estimate.create({
    estimateNumber: 'EST-2025-0003',
    version: 1,
    customer: customers[2]._id,
    vehicle: vehicles[2]._id,
    mileageIn: 52400,
    customerComplaint: 'Check engine light flashing on acceleration, steering pump whine.',
    requestedServices: ['Diagnostic Scan & Misfire Investigation', 'Ignition Coil Pack (Cyl 3)', 'Power Steering Flush'],
    lineItems: [
      {
        itemType: 'part',
        description: 'Mopar High-Energy Ignition Coil Pack',
        partNumber: '56029129AB',
        quantity: 1,
        costPrice: 48.0,
        sellingPrice: 86.4, // 80% markup
        subtotal: 86.4,
        markupApplied: 80,
      },
      {
        itemType: 'part',
        description: 'NGK Iridium Spark Plugs (Set of 8)',
        partNumber: 'LZFR5C-11',
        quantity: 8,
        costPrice: 8.5,
        sellingPrice: 17.0, // 100% markup
        subtotal: 136.0,
        markupApplied: 100,
      },
      {
        itemType: 'part',
        description: 'Mopar Hydraulic Power Steering Fluid +4',
        partNumber: '05142893AA',
        quantity: 2,
        costPrice: 16.0,
        sellingPrice: 32.0, // 100% markup
        subtotal: 64.0,
        markupApplied: 100,
      },
      {
        itemType: 'labor',
        description: 'Electronic Engine Diagnostic Scan & Pinpoint Testing',
        laborHours: 1.0,
        laborRatePerHour: 145.0,
        costPrice: 0,
        sellingPrice: 145.0,
        subtotal: 145.0,
      },
      {
        itemType: 'labor',
        description: 'Replace Spark Plugs, Cyl 3 Coil, & Power Steering Flush',
        laborHours: 2.2,
        laborRatePerHour: 145.0,
        costPrice: 0,
        sellingPrice: 145.0,
        subtotal: 319.0,
      },
    ],
    partsTotal: 286.4,
    tiresTotal: 0,
    laborTotal: 464.0,
    shopSupplies: 32.48,
    subtotal: 782.88,
    taxRate: 0.0825,
    taxAmount: 26.31,
    discount: 0,
    grandTotal: 841.67,
    depositRequired: 420.84, // 50% deposit
    depositMet: false,
    status: 'APPROVED',
    createdBy: writerUser._id,
  });

  const auth3 = await Authorization.create({
    authorizationNumber: 'AUTH-2025-0003',
    repairOrder: new mongoose.Types.ObjectId(),
    estimate: est3._id,
    customer: customers[2]._id,
    authorizedTotal: 841.67,
    approvedItems: ['Ignition Coil & Spark Plugs', 'Diagnostic Scan', 'Power Steering Flush'],
    customerSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    customerSignerName: 'Elena Rodriguez',
    signerPhone: '(972) 414-9921',
    signedAt: new Date(Date.now() - 3600000),
    authorizationType: 'INITIAL',
    serviceWriterWitness: writerUser._id,
    termsAccepted: true,
  });

  const ro3 = await RepairOrder.create({
    roNumber: 'RO-2025-0003',
    customer: customers[2]._id,
    vehicle: vehicles[2]._id,
    mileageIn: 52400,
    customerComplaint: 'Check engine light flashing on acceleration, steering pump whine.',
    requestedServices: ['Diagnostic Scan & Misfire Investigation', 'Ignition Coil Pack (Cyl 3)', 'Power Steering Flush'],
    currentEstimate: est3._id,
    authorization: auth3._id,
    status: 'DEPOSIT_REQUIRED', // 50% required before dispatch
    serviceWriter: writerUser._id,
    timeline: [
      { status: 'INTAKE', timestamp: new Date(Date.now() - 7200000), performedBy: writerUser._id, notes: 'Elena checked in Ram 2500.' },
      { status: 'AUTHORIZED', timestamp: new Date(Date.now() - 3600000), performedBy: writerUser._id, notes: 'Customer signed authorization.' },
      { status: 'DEPOSIT_REQUIRED', timestamp: new Date(Date.now() - 3600000), performedBy: writerUser._id, notes: 'RO exceeds $500.00. 50% deposit of $420.84 required prior to dispatch (SW-008).' },
    ],
  });

  auth3.repairOrder = ro3._id as any;
  await auth3.save();

  est3.repairOrder = ro3._id as any;
  await est3.save();

  // 8. Daily Cash-Up Record for today (SW-015)
  await DailyCashUp.create({
    cashUpNumber: 'CUP-2025-0001',
    businessDate: new Date().toISOString().split('T')[0],
    serviceWriter: writerUser._id,
    serviceWriterName: writerUser.name,
    serviceWriterEmployeeId: writerUser.employeeId,
    openingFloat: 100.0,
    cashSales: 340.0,
    cashRefunds: 0,
    paidOuts: 15.0,
    paidOutDetails: [
      { reason: 'Shop degreaser refill / emergency rags from hardware', amount: 15.0, recipient: 'Home Depot', receiptNumber: 'HD-90214' },
    ],
    expectedCash: 425.0, // 100 + 340 - 0 - 15 = 425.00
    actualCountedCash: 425.0,
    difference: 0.0,
    cashRemovedForDeposit: 325.0, // 425 - 100
    closingDrawerBalance: 100.0, // Strictly $100.00
    employeeSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    employeeSignedAt: new Date(),
    requiresManagerReview: false,
    status: 'APPROVED',
    managerReview: {
      reviewedBy: managerUser._id,
      managerName: managerUser.name,
      reviewedAt: new Date(),
      decision: 'APPROVED',
      notes: 'Balanced register. Exact $100 closing drawer verified.',
    },
  });

  // 9. Computer Modification Requests (OFF-004, 005, 006)
  await ComputerModificationRequest.create([
    {
      requestId: 'CMR-2025-0001',
      employee: writerUser._id,
      employeeName: writerUser.name,
      employeeIdNumber: writerUser.employeeId,
      workstationIdentifier: 'DESK-FRONT-01',
      requestedAction: 'SOFTWARE_INSTALL',
      softwareOrSettingName: 'Adobe Acrobat Reader Pro DC',
      description: 'Need certified PDF digital form signing tools for fleet contracts and export.',
      businessReason: 'Required for commercial customer agreement processing and SOP SW-013 archival.',
      approver: managerUser._id,
      decision: 'APPROVED',
      decisionNotes: 'Approved for business fleet documentation.',
      decisionTimestamp: new Date(Date.now() - 86400000),
      implementedBy: adminUser._id,
      implementationTimestamp: new Date(Date.now() - 80000000),
      implementationNotes: 'Installed and locked down from personal cloud sync per OFF-003.',
      status: 'IMPLEMENTED',
    },
    {
      requestId: 'CMR-2025-0002',
      employee: tech1User._id,
      employeeName: tech1User.name,
      employeeIdNumber: tech1User.employeeId,
      workstationIdentifier: 'TERMINAL-BAY-02',
      requestedAction: 'SOFTWARE_INSTALL',
      softwareOrSettingName: 'Cummins Insite 8.7 Heavy Duty Diagnostic Suite',
      description: 'OEM diagnostic tool for 6.7L diesel ECM calibration and DPF regeneration testing.',
      businessReason: 'Necessary to diagnose fleet diesel trucks under TECH-004.',
      approver: managerUser._id,
      decision: 'APPROVED',
      decisionTimestamp: new Date(Date.now() - 40000000),
      status: 'APPROVED',
    },
  ]);

  // 10. Daily Security Checklist (OFF-008, 009, 010)
  await DailySecurityChecklist.create({
    checklistNumber: 'SEC-CHK-2025-0001',
    businessDate: new Date().toISOString().split('T')[0],
    completedBy: officeUser._id,
    employeeName: officeUser.name,
    employeeIdNumber: officeUser.employeeId,
    companyAccountsOnlyVerified: true,
    personalEmailProhibitedVerified: true,
    personalCloudSyncDisabledVerified: true,
    noAutoLoginObserved: true,
    allWorkstationsLockedAtClose: true,
    allTerminalsSignedOut: true,
    businessDataStorageCompliant: true,
    noSharedCredentialsObserved: true,
    notes: 'All 4 shop bay terminals and 2 front office PCs verified locked and compliant.',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signedAt: new Date(),
    status: 'COMPLETED',
  });

  // 11. Security Incidents (OFF-012)
  await SecurityIncident.create({
    incidentId: 'SEC-INC-2025-0001',
    title: 'Phishing Email Masquerading as Parts Vendor Invoice',
    incidentType: 'Suspicious Email / Phishing',
    severity: 'MEDIUM',
    description: 'Suspicious email with attachment "Invoice_Overdue.exe" sent to parts department mailbox.',
    reportedBy: officeUser._id,
    reporterName: officeUser.name,
    workstationOrDevice: 'DESK-PARTS-01',
    systemsImpacted: ['Email Gateway', 'Parts Department PC'],
    immediateContainmentTaken: 'Email quarantined, sender domain blocked on firewall, employee workstation scanned.',
    assignedInvestigator: adminUser._id,
    investigationFindings: 'No malware executed. Malicious sender IP reported to host provider.',
    remediationPlan: 'Staff briefed on phishing indicators during morning briefing.',
    escalatedToManagement: true,
    managementReview: {
      manager: managerUser._id,
      managerName: managerUser.name,
      reviewedAt: new Date(Date.now() - 172800000),
      notes: 'Excellent catch by Emily. Incident closed.',
    },
    status: 'CLOSED',
    resolvedAt: new Date(Date.now() - 170000000),
  });

  console.log('[Seed] Database seeding completed successfully.');
  console.log('===========================================================');
  console.log(' DEFAULT LOGIN CREDENTIALS (All password: Password123!)');
  console.log(' 1. Admin:           admin@freedomcartruck.com   (EMP-1001)');
  console.log(' 2. Manager:         manager@freedomcartruck.com (EMP-1002)');
  console.log(' 3. Service Writer:  writer@freedomcartruck.com  (EMP-1003)');
  console.log(' 4. Technician #1:   tech1@freedomcartruck.com   (EMP-1004)');
  console.log(' 5. QC Tech #2:      tech2@freedomcartruck.com   (EMP-1005)');
  console.log(' 6. Office Assist:   office@freedomcartruck.com  (EMP-1006)');
  console.log('===========================================================');
}

// Run directly if invoked as script
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await closeDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
