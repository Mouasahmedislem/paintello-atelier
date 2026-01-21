const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Material = require('../models/Material');
const ProductionLog = require('../models/ProductionLog');
const User = require('../models/User');
const moment = require('moment');

// Generate daily report
exports.generateDailyReport = async (req, res) => {
    try {
        const today = moment().startOf('day').toDate();
        const tomorrow = moment(today).add(1, 'day').toDate();

        const [products, materials, logs] = await Promise.all([
            Product.find({ 
                $or: [
                    { createdAt: { $gte: today, $lt: tomorrow } },
                    { lastUpdated: { $gte: today, $lt: tomorrow } }
                ] 
            }).populate('createdBy', 'username email'),
            
            Material.find({ 
                $or: [
                    { lastRestock: { $gte: today, $lt: tomorrow } },
                    { updatedAt: { $gte: today, $lt: tomorrow } }
                ]
            }),
            
            ProductionLog.find({ 
                date: { $gte: today, $lt: tomorrow } 
            }).populate('operator', 'username email')
        ]);

        // Calculate summary
        const summary = {
            totalProducts: products.length,
            byStatus: {},
            materialsUsed: {},
            lowStock: [],
            totalValue: 0
        };

        // Group products by status
        products.forEach(product => {
            summary.byStatus[product.status] = (summary.byStatus[product.status] || 0) + 1;
        });

        // Calculate low stock materials
        const allMaterials = await Material.find({ isActive: true });
        allMaterials.forEach(material => {
            if (material.currentStock < material.minThreshold) {
                summary.lowStock.push({
                    name: material.name,
                    current: material.currentStock,
                    min: material.minThreshold,
                    unit: material.unit,
                    location: material.location
                });
            }
            
            // Calculate total inventory value
            if (material.unitCost) {
                summary.totalValue += material.currentStock * material.unitCost;
            }
        });

        // Calculate materials used from logs
        logs.forEach(log => {
            log.materialsUsed.forEach(material => {
                if (!summary.materialsUsed[material.materialName]) {
                    summary.materialsUsed[material.materialName] = {
                        quantity: 0,
                        unit: material.unit
                    };
                }
                summary.materialsUsed[material.materialName].quantity += material.quantity;
            });
        });

        // Calculate productivity metrics
        const totalProductsWorked = logs.reduce((sum, log) => sum + log.products.length, 0);
        const finishedProducts = logs.reduce((sum, log) => {
            return sum + log.products.filter(p => p.action === 'finished').length;
        }, 0);

        res.json({
            success: true,
            date: moment().format('YYYY-MM-DD'),
            summary: {
                ...summary,
                totalProductsWorked,
                finishedProducts,
                productivityRate: totalProductsWorked > 0 ? 
                    (finishedProducts / totalProductsWorked * 100).toFixed(1) : 0,
                totalLogs: logs.length
            },
            products: products.map(p => ({
                code: p.productCode,
                name: p.name,
                status: p.status,
                quantity: p.quantity,
                dimensions: `${p.dimensions.height}x${p.dimensions.width}x${p.dimensions.depth} cm`,
                location: p.location,
                createdBy: p.createdBy?.username || 'System',
                lastUpdated: p.lastUpdated
            })),
            logs: logs.map(log => ({
                id: log._id,
                date: log.date,
                operator: log.operator?.username || 'Unknown',
                shift: log.shift,
                products: log.products.map(p => ({
                    code: p.productCode,
                    action: p.action,
                    quantity: p.quantity
                })),
                materials: log.materialsUsed.length,
                notes: log.notes
            })).slice(0, 20), // Limit to last 20 logs
            statistics: {
                totalProductsToday: products.length,
                productsByStatus: summary.byStatus,
                lowStockCount: summary.lowStock.length,
                inventoryValue: summary.totalValue.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate daily report'
        });
    }
};

// Generate weekly report
exports.generateWeeklyReport = async (req, res) => {
    try {
        const startOfWeek = moment().startOf('week');
        const endOfWeek = moment().endOf('week');

        const [logs, products, materials] = await Promise.all([
            ProductionLog.find({
                date: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            }).populate('operator', 'username'),
            
            Product.find({
                createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
            }),
            
            Material.find({ isActive: true })
        ]);

        // Initialize daily data
        const dailyData = {};
        for (let day = moment(startOfWeek); day <= endOfWeek; day.add(1, 'day')) {
            const dateStr = day.format('YYYY-MM-DD');
            dailyData[dateStr] = {
                date: dateStr,
                products: 0,
                finished: 0,
                materialsUsed: {}
            };
        }

        // Process logs for daily data
        logs.forEach(log => {
            const dateStr = moment(log.date).format('YYYY-MM-DD');
            if (dailyData[dateStr]) {
                dailyData[dateStr].products += log.products.length;
                dailyData[dateStr].finished += log.products.filter(p => p.action === 'finished').length;

                log.materialsUsed.forEach(material => {
                    if (!dailyData[dateStr].materialsUsed[material.materialName]) {
                        dailyData[dateStr].materialsUsed[material.materialName] = {
                            quantity: 0,
                            unit: material.unit
                        };
                    }
                    dailyData[dateStr].materialsUsed[material.materialName].quantity += material.quantity;
                });
            }
        });

        // Calculate summary
        const totalProducts = products.length;
        const finishedProducts = products.filter(p => p.status === 'finished').length;
        const lowStockMaterials = materials.filter(m => m.currentStock < m.minThreshold);
        
        const totalInventoryValue = materials.reduce((sum, material) => {
            return sum + (material.currentStock * (material.unitCost || 0));
        }, 0);

        const totalMaterialsUsed = logs.reduce((sum, log) => {
            return sum + log.materialsUsed.reduce((s, m) => s + m.quantity, 0);
        }, 0);

        res.json({
            success: true,
            period: {
                start: startOfWeek.format('YYYY-MM-DD'),
                end: endOfWeek.format('YYYY-MM-DD'),
                weekNumber: moment().week()
            },
            summary: {
                totalProducts,
                finishedProducts,
                completionRate: totalProducts > 0 ? (finishedProducts / totalProducts * 100).toFixed(1) : 0,
                totalLogs: logs.length,
                lowStockMaterials: lowStockMaterials.length,
                totalInventoryValue: totalInventoryValue.toFixed(2),
                totalMaterialsUsed
            },
            dailyData: Object.values(dailyData),
            trends: {
                averageDailyProducts: (Object.values(dailyData).reduce((sum, day) => sum + day.products, 0) / 7).toFixed(1),
                averageDailyFinished: (Object.values(dailyData).reduce((sum, day) => sum + day.finished, 0) / 7).toFixed(1),
                bestDay: Object.entries(dailyData).reduce((best, [date, data]) => 
                    data.finished > best.finished ? { date, ...data } : best
                , { date: '', finished: 0 })
            }
        });
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate weekly report'
        });
    }
};

// Generate monthly report
exports.generateMonthlyReport = async (req, res) => {
    try {
        const startOfMonth = moment().startOf('month');
        const endOfMonth = moment().endOf('month');

        const [logs, products, materials] = await Promise.all([
            ProductionLog.find({
                date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            }),
            
            Product.find({
                createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
            }),
            
            Material.find({ isActive: true })
        ]);

        // Calculate monthly summary
        const totalProducts = products.length;
        const finishedProducts = products.filter(p => p.status === 'finished').length;
        
        const productsByCategory = products.reduce((acc, product) => {
            acc[product.category] = (acc[product.category] || 0) + 1;
            return acc;
        }, {});

        const productsByStatus = products.reduce((acc, product) => {
            acc[product.status] = (acc[product.status] || 0) + 1;
            return acc;
        }, {});

        // Calculate material consumption
        const materialConsumption = {};
        logs.forEach(log => {
            log.materialsUsed.forEach(material => {
                if (!materialConsumption[material.materialName]) {
                    materialConsumption[material.materialName] = {
                        total: 0,
                        unit: material.unit,
                        cost: 0
                    };
                }
                materialConsumption[material.materialName].total += material.quantity;
            });
        });

        // Calculate costs
        let totalMaterialCost = 0;
        Object.entries(materialConsumption).forEach(([name, data]) => {
            const material = materials.find(m => m.name === name);
            if (material && material.unitCost) {
                data.cost = data.total * material.unitCost;
                totalMaterialCost += data.cost;
            }
        });

        // Calculate efficiency
        const totalHoursWorked = logs.reduce((sum, log) => {
            return sum + log.products.reduce((s, p) => s + (p.timeSpent || 0), 0) / 60;
        }, 0);

        const productsPerHour = totalHoursWorked > 0 ? (totalProducts / totalHoursWorked).toFixed(2) : 0;

        res.json({
            success: true,
            period: {
                month: moment().format('MMMM YYYY'),
                start: startOfMonth.format('YYYY-MM-DD'),
                end: endOfMonth.format('YYYY-MM-DD')
            },
            summary: {
                totalProducts,
                finishedProducts,
                completionRate: totalProducts > 0 ? (finishedProducts / totalProducts * 100).toFixed(1) : 0,
                totalLogs: logs.length,
                productsByCategory,
                productsByStatus
            },
            materials: {
                consumption: materialConsumption,
                totalCost: totalMaterialCost.toFixed(2),
                lowStockCount: materials.filter(m => m.currentStock < m.minThreshold).length
            },
            efficiency: {
                totalHoursWorked: totalHoursWorked.toFixed(1),
                productsPerHour,
                averageTimePerProduct: totalProducts > 0 ? (totalHoursWorked * 60 / totalProducts).toFixed(1) : 0
            },
            financials: {
                totalMaterialCost: totalMaterialCost.toFixed(2),
                averageCostPerProduct: totalProducts > 0 ? (totalMaterialCost / totalProducts).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate monthly report'
        });
    }
};

// Export to Excel
exports.exportToExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Paintello Atelier';
        workbook.lastModifiedBy = 'Paintello System';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Products Sheet
        const productsSheet = workbook.addWorksheet('Products');
        productsSheet.columns = [
            { header: 'Product Code', key: 'code', width: 15 },
            { header: 'Product Name', key: 'name', width: 30 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Dimensions (HxWxD cm)', key: 'dimensions', width: 20 },
            { header: 'Weight (kg)', key: 'weight', width: 12 },
            { header: 'Location', key: 'location', width: 20 },
            { header: 'Created Date', key: 'created', width: 20 },
            { header: 'Last Updated', key: 'updated', width: 20 },
            { header: 'Notes', key: 'notes', width: 40 }
        ];

        const products = await Product.find().sort('-createdAt').populate('createdBy', 'username');
        products.forEach(product => {
            productsSheet.addRow({
                code: product.productCode,
                name: product.name,
                category: product.category,
                status: product.status,
                quantity: product.quantity,
                dimensions: `${product.dimensions.height}×${product.dimensions.width}×${product.dimensions.depth}`,
                weight: product.weight || 0,
                location: product.location || '',
                created: moment(product.createdAt).format('YYYY-MM-DD HH:mm'),
                updated: moment(product.lastUpdated).format('YYYY-MM-DD HH:mm'),
                notes: product.notes || ''
            });
        });

        // Materials Sheet
        const materialsSheet = workbook.addWorksheet('Materials');
        materialsSheet.columns = [
            { header: 'Material Code', key: 'code', width: 15 },
            { header: 'Material Name', key: 'name', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Current Stock', key: 'stock', width: 15 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Min Threshold', key: 'min', width: 15 },
            { header: 'Unit Cost ($)', key: 'cost', width: 15 },
            { header: 'Total Value ($)', key: 'value', width: 15 },
            { header: 'Supplier', key: 'supplier', width: 25 },
            { header: 'Location', key: 'location', width: 20 },
            { header: 'Last Restock', key: 'restock', width: 20 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        const materials = await Material.find().sort('name');
        materials.forEach(material => {
            const totalValue = material.currentStock * (material.unitCost || 0);
            const status = material.currentStock === 0 ? 'Out of Stock' : 
                          material.currentStock < material.minThreshold ? 'Low Stock' : 'In Stock';
            
            materialsSheet.addRow({
                code: material.materialCode,
                name: material.name,
                type: material.type,
                stock: material.currentStock,
                unit: material.unit,
                min: material.minThreshold,
                cost: material.unitCost ? material.unitCost.toFixed(2) : '',
                value: totalValue.toFixed(2),
                supplier: material.supplier || '',
                location: material.location || '',
                restock: material.lastRestock ? moment(material.lastRestock).format('YYYY-MM-DD') : '',
                status: status
            });
        });

        // Production Logs Sheet
        const logsSheet = workbook.addWorksheet('Production Logs');
        logsSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Shift', key: 'shift', width: 10 },
            { header: 'Operator', key: 'operator', width: 20 },
            { header: 'Workstation', key: 'workstation', width: 15 },
            { header: 'Products Count', key: 'products', width: 15 },
            { header: 'Materials Count', key: 'materials', width: 15 },
            { header: 'Finished Products', key: 'finished', width: 15 },
            { header: 'Total Time (min)', key: 'time', width: 15 },
            { header: 'Notes', key: 'notes', width: 40 }
        ];

        const logs = await ProductionLog.find()
            .populate('operator', 'username')
            .sort('-date')
            .limit(100);

        logs.forEach(log => {
            const finishedCount = log.products.filter(p => p.action === 'finished').length;
            const totalTime = log.products.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
            
            logsSheet.addRow({
                date: moment(log.date).format('YYYY-MM-DD HH:mm'),
                shift: log.shift,
                operator: log.operator?.username || 'Unknown',
                workstation: log.workstation || '',
                products: log.products.length,
                materials: log.materialsUsed.length,
                finished: finishedCount,
                time: totalTime,
                notes: log.notes || ''
            });
        });

        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 30 },
            { header: 'Details', key: 'details', width: 50 }
        ];

        // Get summary data
        const [totalProductsCount, totalMaterialsCount, lowStockCount] = await Promise.all([
            Product.countDocuments(),
            Material.countDocuments({ isActive: true }),
            Material.countDocuments({ 
                currentStock: { $lt: { $min: ['$minThreshold', 10] } },
                isActive: true 
            })
        ]);

        const finishedProductsCount = await Product.countDocuments({ status: 'finished' });
        const todayLogsCount = await ProductionLog.countDocuments({
            date: { 
                $gte: moment().startOf('day').toDate(),
                $lt: moment().endOf('day').toDate()
            }
        });

        summarySheet.addRow({
            metric: 'Total Products',
            value: totalProductsCount,
            details: 'All products in the system'
        });

        summarySheet.addRow({
            metric: 'Finished Products',
            value: finishedProductsCount,
            details: 'Products with status "finished"'
        });

        summarySheet.addRow({
            metric: 'Total Materials',
            value: totalMaterialsCount,
            details: 'Active materials in inventory'
        });

        summarySheet.addRow({
            metric: 'Low Stock Materials',
            value: lowStockCount,
            details: 'Materials below minimum threshold'
        });

        summarySheet.addRow({
            metric: "Today's Production Logs",
            value: todayLogsCount,
            details: 'Production logs created today'
        });

        summarySheet.addRow({
            metric: 'Report Generated',
            value: moment().format('YYYY-MM-DD HH:mm:ss'),
            details: 'Date and time of report generation'
        });

        // Style the headers
        [productsSheet, materialsSheet, logsSheet, summarySheet].forEach(sheet => {
            sheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4F81BD' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=paintello-report-${moment().format('YYYY-MM-DD')}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export to Excel'
        });
    }
};

// Material consumption report
exports.materialConsumptionReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = startDate ? moment(startDate).startOf('day') : moment().subtract(30, 'days').startOf('day');
        const end = endDate ? moment(endDate).endOf('day') : moment().endOf('day');

        const logs = await ProductionLog.find({
            date: { $gte: start.toDate(), $lte: end.toDate() }
        });

        const materialConsumption = {};
        let totalCost = 0;

        logs.forEach(log => {
            log.materialsUsed.forEach(material => {
                if (!materialConsumption[material.materialCode]) {
                    materialConsumption[material.materialCode] = {
                        name: material.materialName,
                        total: 0,
                        unit: material.unit,
                        cost: 0
                    };
                }
                materialConsumption[material.materialCode].total += material.quantity;
            });
        });

        // Calculate costs
        const materials = await Material.find({ 
            materialCode: { $in: Object.keys(materialConsumption) }
        });

        Object.keys(materialConsumption).forEach(code => {
            const material = materials.find(m => m.materialCode === code);
            if (material && material.unitCost) {
                const cost = materialConsumption[code].total * material.unitCost;
                materialConsumption[code].cost = cost;
                totalCost += cost;
            }
        });

        res.json({
            success: true,
            period: {
                start: start.format('YYYY-MM-DD'),
                end: end.format('YYYY-MM-DD'),
                days: end.diff(start, 'days')
            },
            summary: {
                totalMaterialsUsed: Object.keys(materialConsumption).length,
                totalQuantity: Object.values(materialConsumption).reduce((sum, m) => sum + m.total, 0),
                totalCost: totalCost.toFixed(2)
            },
            consumption: Object.values(materialConsumption).sort((a, b) => b.total - a.total)
        });
    } catch (error) {
        console.error('Error generating material consumption report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate material consumption report'
        });
    }
};

// Productivity report
exports.productivityReport = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        
        let start, end;
        switch(period) {
            case 'week':
                start = moment().startOf('week');
                end = moment().endOf('week');
                break;
            case 'month':
                start = moment().startOf('month');
                end = moment().endOf('month');
                break;
            case 'year':
                start = moment().startOf('year');
                end = moment().endOf('year');
                break;
            default:
                start = moment().startOf('week');
                end = moment().endOf('week');
        }

        const [logs, products, users] = await Promise.all([
            ProductionLog.find({
                date: { $gte: start.toDate(), $lte: end.toDate() }
            }).populate('operator', 'username email'),
            
            Product.find({
                createdAt: { $gte: start.toDate(), $lte: end.toDate() }
            }),
            
            User.find({ role: { $in: ['operator', 'admin'] } })
        ]);

        // Calculate productivity by operator
        const operatorProductivity = {};
        logs.forEach(log => {
            if (log.operator) {
                const operatorId = log.operator._id.toString();
                if (!operatorProductivity[operatorId]) {
                    operatorProductivity[operatorId] = {
                        operator: log.operator,
                        totalLogs: 0,
                        totalProducts: 0,
                        finishedProducts: 0,
                        totalTime: 0
                    };
                }
                
                operatorProductivity[operatorId].totalLogs++;
                operatorProductivity[operatorId].totalProducts += log.products.length;
                operatorProductivity[operatorId].finishedProducts += log.products.filter(p => p.action === 'finished').length;
                operatorProductivity[operatorId].totalTime += log.products.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
            }
        });

        // Convert to array and calculate efficiency
        const operatorData = Object.values(operatorProductivity).map(data => {
            const efficiency = data.totalProducts > 0 ? 
                (data.finishedProducts / data.totalProducts * 100) : 0;
            
            const avgTimePerProduct = data.totalProducts > 0 ? 
                (data.totalTime / data.totalProducts) : 0;

            return {
                operator: {
                    username: data.operator.username,
                    email: data.operator.email
                },
                totalLogs: data.totalLogs,
                totalProducts: data.totalProducts,
                finishedProducts: data.finishedProducts,
                efficiency: efficiency.toFixed(1),
                avgTimePerProduct: avgTimePerProduct.toFixed(1),
                totalHours: (data.totalTime / 60).toFixed(1)
            };
        });

        // Overall statistics
        const totalProductsCreated = products.length;
        const totalProductsFinished = products.filter(p => p.status === 'finished').length;
        const totalLogsCount = logs.length;
        const totalProductionTime = logs.reduce((sum, log) => {
            return sum + log.products.reduce((s, p) => s + (p.timeSpent || 0), 0);
        }, 0) / 60; // Convert to hours

        const overallEfficiency = totalProductsCreated > 0 ? 
            (totalProductsFinished / totalProductsCreated * 100) : 0;

        const avgTimePerProduct = totalProductsCreated > 0 ? 
            (totalProductionTime * 60 / totalProductsCreated) : 0;

        res.json({
            success: true,
            period: {
                name: period,
                start: start.format('YYYY-MM-DD'),
                end: end.format('YYYY-MM-DD')
            },
            summary: {
                totalOperators: users.length,
                totalLogs: totalLogsCount,
                totalProductsCreated,
                totalProductsFinished,
                overallEfficiency: overallEfficiency.toFixed(1),
                totalProductionHours: totalProductionTime.toFixed(1),
                avgTimePerProduct: avgTimePerProduct.toFixed(1),
                productsPerHour: totalProductionTime > 0 ? 
                    (totalProductsCreated / totalProductionTime).toFixed(2) : 0
            },
            operatorProductivity: operatorData.sort((a, b) => b.efficiency - a.efficiency),
            recommendations: generateProductivityRecommendations(operatorData, overallEfficiency)
        });
    } catch (error) {
        console.error('Error generating productivity report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate productivity report'
        });
    }
};

// Helper function to generate productivity recommendations
function generateProductivityRecommendations(operatorData, overallEfficiency) {
    const recommendations = [];
    
    if (overallEfficiency < 70) {
        recommendations.push({
            type: 'warning',
            message: 'Overall efficiency is below target (70%). Consider reviewing production processes.',
            priority: 'high'
        });
    }

    if (operatorData.length > 0) {
        const avgEfficiency = operatorData.reduce((sum, op) => sum + parseFloat(op.efficiency), 0) / operatorData.length;
        
        operatorData.forEach(op => {
            if (parseFloat(op.efficiency) < avgEfficiency * 0.7) {
                recommendations.push({
                    type: 'info',
                    message: `${op.operator.username} has lower efficiency (${op.efficiency}%) than average. Consider additional training.`,
                    priority: 'medium'
                });
            }
        });

        // Find top performer
        const topPerformer = operatorData.reduce((best, current) => 
            parseFloat(current.efficiency) > parseFloat(best.efficiency) ? current : best
        );

        recommendations.push({
            type: 'success',
            message: `${topPerformer.operator.username} is the top performer with ${topPerformer.efficiency}% efficiency.`,
            priority: 'low'
        });
    }

    return recommendations;
}
